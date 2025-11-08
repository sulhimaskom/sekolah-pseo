# Sekolah PSEO

这是学校 PSEO 项目的文档。

## 目录结构

- `src/` - 源代码
- `tests/` - 测试文件
- `scripts/` - 脚本文件
- `data/` - 数据文件

## 开发指南

1. 克隆仓库
2. 安装依赖: `npm install`
3. 运行ETL处理: `npm run etl`
4. 构建页面: `npm run build`
5. 生成站点地图: `npm run sitemap`
6. 验证链接: `npm run validate-links`

## 可用脚本

- `npm run build` - 生成学校页面
- `npm run etl` - 处理原始数据
- `npm run sitemap` - 生成站点地图
- `npm run validate-links` - 验证内部链接
- `npm test` - 运行所有测试

## 环境变量

- `SITE_URL` - 网站基础URL，用于生成站点地图 (默认: https://example.com)
- `RAW_DATA_PATH` - 原始数据文件路径 (默认: external/raw.csv)
- `VALIDATION_CONCURRENCY_LIMIT` - 链接验证并发限制 (默认: 50)

## 贡献

欢迎贡献代码和文档。