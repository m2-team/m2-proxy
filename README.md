# 这是一个代理服务器
## 应用场景
1. 查看HTTP请求信息
2. 修改HTTP请求到本地文件
3. 修改hosts文件
4. 方便进行移动端调试
5. 禁用cookie、请求加载出错等
5. 快速下载单个页面的所有静态资源
6. 可以部署到远程服务器上，也可以本地运行直接测试
## 类型
1. 处理静态资源请求和请求控制
- static
- command
2. 代理处理类
- transparent — 不处理
- delay:100 — 延迟发送请求
- headers — 新增、修改请求Header信息
- file — 修改请求的文件到本地
- redirect — 跳转到某个其它地址
- reset — reset请求
- hosts — 修改hosts信息