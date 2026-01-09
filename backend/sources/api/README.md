# API 数据源预留目录

此目录用于存放官方 API 数据源实现。

当官方提供 API 接口时，只需实现 `DataSource` 基类即可无缝接入。

## 实现示例

```python
from sources.base import DataSource

class SSQApiSource(DataSource):
    async def fetch_by_count(self, count: int):
        # 调用官方 API
        pass
    
    async def fetch_by_period(self, start: str, end: str):
        # 调用官方 API
        pass
```
