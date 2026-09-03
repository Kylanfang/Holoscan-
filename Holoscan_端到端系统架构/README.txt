NVIDIA Holoscan 端到端系统架构图（离线分发包）
================================================

快速查看
--------
1. 先将 ZIP 完整解压到本地文件夹。
2. 双击“index.html”。
3. 使用 Chrome、Microsoft Edge 或 Firefox 打开。

无需安装
--------
- 不需要 Python
- 不需要 Node.js
- 不需要 Archify
- 不需要 NVIDIA SDK
- 不需要互联网连接

主要功能
--------
- 深色/浅色主题切换
- 交互式路径导览
- 缩放、平移和语义透镜
- 从页面内导出 SVG、PNG、JPEG、WebP 或 WebM

文件说明
--------
- index.html：主架构图，自包含、可离线运行
- previews/：明暗主题静态预览图
- source/holoscan_architecture.json：Archify 架构源文件
- validation/：showcase 自动化检查报告及原始回执

架构范围
--------
Sensor → Sensor Bridge FPGA → ConnectX SmartNIC → GPU Memory
→ Holoscan 接收算子 → GPU 处理流水线 → 结果输出

同时包含 Linux Socket/System Memory 备用数据路径，以及
Holoscan Application、Runtime、Hololink 和 FPGA 外设控制路径。

注意
----
不要只发送 index.html 的浏览器快捷方式；应发送整个 ZIP 文件。
解压后可移动整个文件夹，但不要改变内部目录结构。
