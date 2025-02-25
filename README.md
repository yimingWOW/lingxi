# 灵犀
一个chrome插件：在浏览网页时便捷的使用chatgpt固定提问

下载本仓库文件；

首先打开chrome浏览器插件页面，点击“管理扩展程序”，点击右上角的“开发者模式”；然后点击“加载已解压的扩展程序”，选择本仓库下的lingxi文件夹。

安装后，打开灵犀插件，在弹出的页面中输入 你想使用的大模型的api key，然后点击保存。

目前我添加的大模型有：
    - openai: 'https://api.openai.com/v1/chat/completions',
    - gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    - claude: 'https://api.anthropic.com/v1/messages',
    - huggingface: 'https://api-inference.huggingface.co/models/facebook/opt-350m'


获取大模型的api key：https://platform.openai.com/settings/organization/api-keys 
获取gemini的api key：https://console.cloud.google.com/apis/credentials?project=gemini-1-pro-v1516
获取claude的api key：https://console.anthropic.com/settings/keys
获取huggingface的api key：https://huggingface.co/settings/tokens

除了huggingface外，其他大模型的api都是收费的，请自行选择使用。你也可以购买私人部署的模型并使用其提供的url-apikey。

然后在插件中添加你常用的prompt模板，并选择好默认模版，就可以在浏览网页时右键，ask chatgpt了。

