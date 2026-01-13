/**
 * 六合彩波色和生肖工具函数
 * 
 * 生肖规则：
 * - 每年农历新年切换，一整年固定
 * - 1号对应当年生肖，然后逆推（2号是前一年生肖，依此类推）
 * - 每12个号码循环一次
 */

// 波色映射（固定不变）
const RED_WAVE = [1, 2, 7, 8, 12, 13, 18, 19, 23, 24, 29, 30, 34, 35, 40, 45, 46];
const BLUE_WAVE = [3, 4, 9, 10, 14, 15, 20, 25, 26, 31, 36, 37, 41, 42, 47, 48];
const GREEN_WAVE = [5, 6, 11, 16, 17, 21, 22, 27, 28, 32, 33, 38, 39, 43, 44, 49];

// 十二生肖（固定顺序）
const ZODIACS = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"];

/**
 * 农历新年日期表（公历月-日）
 * 用于判断某日期属于哪个农历年
 */
const LUNAR_NEW_YEAR_DATES: Record<number, [number, number]> = {
    2020: [1, 25],   // 2020年1月25日 - 鼠年开始
    2021: [2, 12],   // 2021年2月12日 - 牛年开始
    2022: [2, 1],    // 2022年2月1日 - 虎年开始
    2023: [1, 22],   // 2023年1月22日 - 兔年开始
    2024: [2, 10],   // 2024年2月10日 - 龙年开始
    2025: [1, 29],   // 2025年1月29日 - 蛇年开始
    2026: [2, 17],   // 2026年2月17日 - 马年开始
    2027: [2, 6],    // 2027年2月6日 - 羊年开始
    2028: [1, 26],   // 2028年1月26日 - 猴年开始
    2029: [2, 13],   // 2029年2月13日 - 鸡年开始
    2030: [2, 3],    // 2030年2月3日 - 狗年开始
};

// 公历年份对应的农历生肖（该年农历新年后的生肖）
const YEAR_ZODIAC: Record<number, number> = {
    2020: 0,  // 鼠
    2021: 1,  // 牛
    2022: 2,  // 虎
    2023: 3,  // 兔
    2024: 4,  // 龙
    2025: 5,  // 蛇
    2026: 6,  // 马
    2027: 7,  // 羊
    2028: 8,  // 猴
    2029: 9,  // 鸡
    2030: 10, // 狗
};

/**
 * 获取号码的波色
 */
export function getWaveColor(num: number): "red" | "blue" | "green" {
    if (RED_WAVE.includes(num)) return "red";
    if (BLUE_WAVE.includes(num)) return "blue";
    return "green";
}

/**
 * 获取波色的中文名
 */
export function getWaveColorName(num: number): string {
    const color = getWaveColor(num);
    return color === "red" ? "红波" : color === "blue" ? "蓝波" : "绿波";
}

/**
 * 根据日期判断所属的农历年份
 * @param year 公历年份
 * @param month 公历月份 (1-12)
 * @param day 公历日期 (1-31)
 * @returns 农历年份（用于查生肖）
 */
function getLunarYear(year: number, month: number, day: number): number {
    const cnyDate = LUNAR_NEW_YEAR_DATES[year];
    if (!cnyDate) {
        // 如果没有数据，用简单估算（2月中旬）
        if (month < 2 || (month === 2 && day < 15)) {
            return year - 1;
        }
        return year;
    }

    const [cnyMonth, cnyDay] = cnyDate;
    // 如果当前日期在农历新年之前，属于上一年
    if (month < cnyMonth || (month === cnyMonth && day < cnyDay)) {
        return year - 1;
    }
    return year;
}

/**
 * 获取指定农历年的1号对应的生肖索引
 */
function getYearZodiacIndex(lunarYear: number): number {
    if (YEAR_ZODIAC[lunarYear] !== undefined) {
        return YEAR_ZODIAC[lunarYear];
    }
    // 计算未在表中的年份
    const baseYear = 2020;
    const baseZodiac = 0; // 鼠
    const diff = lunarYear - baseYear;
    return ((baseZodiac + diff) % 12 + 12) % 12;
}

/**
 * 获取号码对应的生肖
 * @param num 号码 1-49
 * @param year 公历年份
 * @param month 公历月份 (可选，默认根据期数推算)
 * @param day 公历日期 (可选)
 */
export function getZodiac(num: number, year: number, month?: number, day?: number): string {
    // 如果没有提供月日，根据2026年判断（2026年1月是蛇年）
    const lunarYear = getLunarYear(year, month || 1, day || 15);
    const yearZodiacIndex = getYearZodiacIndex(lunarYear);

    // 计算号码对应的生肖
    // 规则：1号是当年生肖，2号是前一年生肖（逆推）
    // 例如蛇年：1=蛇(5), 2=龙(4), 3=兔(3), ..., 6=鼠(0), 7=猪(11), ...
    const numOffset = (num - 1) % 12;
    const zodiacIndex = (yearZodiacIndex - numOffset + 12) % 12;

    return ZODIACS[zodiacIndex];
}

/**
 * 根据日期字符串解析年月日
 */
export function parseDateString(dateStr: string): { year: number; month: number; day: number } | null {
    if (!dateStr) return null;
    // 格式如 "2026-01-10" 或 "2026-01-10+08:00"
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
        return {
            year: parseInt(match[1]),
            month: parseInt(match[2]),
            day: parseInt(match[3])
        };
    }
    return null;
}

/**
 * 根据开奖日期获取号码生肖
 */
export function getZodiacByDate(num: number, dateStr: string): string {
    const parsed = parseDateString(dateStr);
    if (parsed) {
        return getZodiac(num, parsed.year, parsed.month, parsed.day);
    }
    // 回退：假设当前年份
    return getZodiac(num, new Date().getFullYear());
}

/**
 * 获取指定年份的生肖名称
 */
export function getYearZodiac(year: number, month?: number, day?: number): string {
    const lunarYear = getLunarYear(year, month || 6, day || 15);
    const index = getYearZodiacIndex(lunarYear);
    return ZODIACS[index];
}

// 导出常量供其他地方使用
export { ZODIACS, RED_WAVE, BLUE_WAVE, GREEN_WAVE };
