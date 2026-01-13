## 请求头
https://info.cld.hkjc.com/graphql/base/

## payload
{
    "lastNDraw": 5,
    "drawType": "All",
    "startDate": null,
    "endDate": null
}

{
  "operationName": "marksixResult",
  "variables": {
    "lastNDraw": 5,
    "drawType": "All",
    "startDate": null,
    "endDate": null
  },
  "query": "fragment lotteryDrawsFragment on LotteryDraw {\n  id\n  year\n  no\n  openDate\n  closeDate\n  drawDate\n  status\n  snowballCode\n  snowballName_en\n  snowballName_ch\n  lotteryPool {\n    sell\n    status\n    totalInvestment\n    jackpot\n    unitBet\n    estimatedPrize\n    derivedFirstPrizeDiv\n    lotteryPrizes {\n      type\n      winningUnit\n      dividend\n    }\n  }\n  drawResult {\n    drawnNo\n    xDrawnNo\n  }\n}\n\nquery marksixResult($lastNDraw: Int, $startDate: String, $endDate: String, $drawType: LotteryDrawType) {\n  lotteryDraws(\n    lastNDraw: $lastNDraw\n    startDate: $startDate\n    endDate: $endDate\n    drawType: $drawType\n  ) {\n    ...lotteryDrawsFragment\n  }\n}"
}

## response
{
    "data": {
        "lotteryDraws": [
            {
                "id": "20264N",
                "year": "2026",
                "no": 4,
                "openDate": "2026-01-08+08:00",
                "closeDate": "2026-01-10T21:15:00+08:00",
                "drawDate": "2026-01-10+08:00",
                "status": "Result",
                "snowballCode": "",
                "snowballName_en": "",
                "snowballName_ch": "",
                "lotteryPool": {
                    "sell": false,
                    "status": "Payout",
                    "totalInvestment": "38972058",
                    "jackpot": "0",
                    "unitBet": 10,
                    "estimatedPrize": "",
                    "derivedFirstPrizeDiv": "8000000",
                    "lotteryPrizes": [
                        {
                            "type": 1,
                            "winningUnit": 0,
                            "dividend": "0"
                        },
                        {
                            "type": 2,
                            "winningUnit": 0,
                            "dividend": "0"
                        },
                        {
                            "type": 3,
                            "winningUnit": 445,
                            "dividend": "91200"
                        },
                        {
                            "type": 4,
                            "winningUnit": 1170,
                            "dividend": "9600"
                        },
                        {
                            "type": 5,
                            "winningUnit": 30094,
                            "dividend": "640"
                        },
                        {
                            "type": 6,
                            "winningUnit": 36396,
                            "dividend": "320"
                        },
                        {
                            "type": 7,
                            "winningUnit": 585720,
                            "dividend": "40"
                        }
                    ]
                },
                "drawResult": {
                    "drawnNo": [
                        3,
                        16,
                        20,
                        22,
                        24,
                        37
                    ],
                    "xDrawnNo": 42
                }
            },
            {
                "id": "20263N",
                "year": "2026",
                "no": 3,
                "openDate": "2026-01-06+08:00",
                "closeDate": "2026-01-08T21:15:00+08:00",
                "drawDate": "2026-01-08+08:00",
                "status": "Result",
                "snowballCode": "",
                "snowballName_en": "",
                "snowballName_ch": "",
                "lotteryPool": {
                    "sell": false,
                    "status": "Payout",
                    "totalInvestment": "47327267",
                    "jackpot": "8000000",
                    "unitBet": 10,
                    "estimatedPrize": "",
                    "derivedFirstPrizeDiv": "13000000",
                    "lotteryPrizes": [
                        {
                            "type": 1,
                            "winningUnit": 10,
                            "dividend": "13667750"
                        },
                        {
                            "type": 2,
                            "winningUnit": 15,
                            "dividend": "1259500"
                        },
                        {
                            "type": 3,
                            "winningUnit": 800,
                            "dividend": "62970"
                        },
                        {
                            "type": 4,
                            "winningUnit": 1365,
                            "dividend": "9600"
                        },
                        {
                            "type": 5,
                            "winningUnit": 33120,
                            "dividend": "640"
                        },
                        {
                            "type": 6,
                            "winningUnit": 46105,
                            "dividend": "320"
                        },
                        {
                            "type": 7,
                            "winningUnit": 597156,
                            "dividend": "40"
                        }
                    ]
                },
                "drawResult": {
                    "drawnNo": [
                        15,
                        21,
                        24,
                        40,
                        45,
                        46
                    ],
                    "xDrawnNo": 13
                }
            },
            {
                "id": "20262N",
                "year": "2026",
                "no": 2,
                "openDate": "2026-01-03+08:00",
                "closeDate": "2026-01-06T21:15:00+08:00",
                "drawDate": "2026-01-06+08:00",
                "status": "Result",
                "snowballCode": "",
                "snowballName_en": "",
                "snowballName_ch": "",
                "lotteryPool": {
                    "sell": false,
                    "status": "Payout",
                    "totalInvestment": "43413858",
                    "jackpot": "0",
                    "unitBet": 10,
                    "estimatedPrize": "",
                    "derivedFirstPrizeDiv": "8000000",
                    "lotteryPrizes": [
                        {
                            "type": 1,
                            "winningUnit": 0,
                            "dividend": "0"
                        },
                        {
                            "type": 2,
                            "winningUnit": 105,
                            "dividend": "121900"
                        },
                        {
                            "type": 3,
                            "winningUnit": 1670,
                            "dividend": "20430"
                        },
                        {
                            "type": 4,
                            "winningUnit": 7061,
                            "dividend": "9600"
                        },
                        {
                            "type": 5,
                            "winningUnit": 71043,
                            "dividend": "640"
                        },
                        {
                            "type": 6,
                            "winningUnit": 127836,
                            "dividend": "320"
                        },
                        {
                            "type": 7,
                            "winningUnit": 1030199,
                            "dividend": "40"
                        }
                    ]
                },
                "drawResult": {
                    "drawnNo": [
                        2,
                        8,
                        12,
                        19,
                        28,
                        36
                    ],
                    "xDrawnNo": 1
                }
            },
            {
                "id": "20261N",
                "year": "2026",
                "no": 1,
                "openDate": "2025-12-28+08:00",
                "closeDate": "2026-01-03T21:15:00+08:00",
                "drawDate": "2026-01-03+08:00",
                "status": "Result",
                "snowballCode": "SBD",
                "snowballName_en": "New Year Snowball",
                "snowballName_ch": "新年金多寶",
                "lotteryPool": {
                    "sell": false,
                    "status": "Payout",
                    "totalInvestment": "248509427",
                    "jackpot": "75000000",
                    "unitBet": 10,
                    "estimatedPrize": "",
                    "derivedFirstPrizeDiv": "100000000",
                    "lotteryPrizes": [
                        {
                            "type": 1,
                            "winningUnit": 15,
                            "dividend": "68074450"
                        },
                        {
                            "type": 2,
                            "winningUnit": 140,
                            "dividend": "645510"
                        },
                        {
                            "type": 3,
                            "winningUnit": 4670,
                            "dividend": "51600"
                        },
                        {
                            "type": 4,
                            "winningUnit": 11894,
                            "dividend": "9600"
                        },
                        {
                            "type": 5,
                            "winningUnit": 235580,
                            "dividend": "640"
                        },
                        {
                            "type": 6,
                            "winningUnit": 307477,
                            "dividend": "320"
                        },
                        {
                            "type": 7,
                            "winningUnit": 4085179,
                            "dividend": "40"
                        }
                    ]
                },
                "drawResult": {
                    "drawnNo": [
                        2,
                        10,
                        13,
                        16,
                        20,
                        21
                    ],
                    "xDrawnNo": 14
                }
            },
            {
                "id": "2025134N",
                "year": "2025",
                "no": 134,
                "openDate": "2025-12-25+08:00",
                "closeDate": "2025-12-28T21:15:00+08:00",
                "drawDate": "2025-12-28+08:00",
                "status": "Result",
                "snowballCode": "",
                "snowballName_en": "",
                "snowballName_ch": "",
                "lotteryPool": {
                    "sell": false,
                    "status": "Payout",
                    "totalInvestment": "70940715",
                    "jackpot": "24216278",
                    "unitBet": 10,
                    "estimatedPrize": "",
                    "derivedFirstPrizeDiv": "31000000",
                    "lotteryPrizes": [
                        {
                            "type": 1,
                            "winningUnit": 15,
                            "dividend": "20594740"
                        },
                        {
                            "type": 2,
                            "winningUnit": 65,
                            "dividend": "342350"
                        },
                        {
                            "type": 3,
                            "winningUnit": 3145,
                            "dividend": "19200"
                        },
                        {
                            "type": 4,
                            "winningUnit": 3560,
                            "dividend": "9600"
                        },
                        {
                            "type": 5,
                            "winningUnit": 116230,
                            "dividend": "640"
                        },
                        {
                            "type": 6,
                            "winningUnit": 91950,
                            "dividend": "320"
                        },
                        {
                            "type": 7,
                            "winningUnit": 1688817,
                            "dividend": "40"
                        }
                    ]
                },
                "drawResult": {
                    "drawnNo": [
                        7,
                        10,
                        11,
                        19,
                        25,
                        30
                    ],
                    "xDrawnNo": 45
                }
            }
        ]
    }
}

## user-agent
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36