# 灵犀

一个 Chrome 插件：在浏览网页时便捷地使用大语言模型进行固定提问。

## 安装步骤

1. 下载本仓库文件
2. 打开 Chrome 浏览器插件页面，点击"管理扩展程序"
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"，选择本仓库下的 lingxi 文件夹
5. 安装完成后，在浏览器右上角点击灵犀图标
6. 在弹出的页面中输入相应的 API Key，然后点击保存

## 支持的模型

目前支持以下大语言模型：

- OpenAI GPT
  - API 地址：`https://api.openai.com/v1/chat/completions`
  - [获取 API Key](https://platform.openai.com/settings/organization/api-keys)

- Google Gemini
  - API 地址：`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`

- Anthropic Claude
  - API 地址：`https://api.anthropic.com/v1/messages`

- Hugging Face
  - API 地址：`https://api-inference.huggingface.co/models/facebook/opt-350m`

## 使用说明

1. 首先需要注册相应平台的账号并获取 API Key
2. 在插件设置中选择想要使用的模型
3. 输入对应的 API Key 和 API 地址（如有需要）
4. 保存设置后即可使用

获取gemini的api key：https://console.cloud.google.com/apis/credentials?project=gemini-1-pro-v1516
获取claude的api key：https://console.anthropic.com/settings/keys
获取huggingface的api key：https://huggingface.co/settings/tokens

除了huggingface外，其他大模型的api都是收费的，请自行选择使用。你也可以购买私人部署的模型并使用其提供的url-apikey。

然后在插件中添加你常用的prompt模板，并选择好默认模版，就可以在浏览网页时右键，ask chatgpt了。

## 注意事项

- 这个插件不依赖任何我提供的转发或后台服务，直接接入你选择的大模型，涉及到的api key请自行保管
- 尤其不要向大模型泄漏你的敏感信息，比如密码、私钥等！
- 请勿在公共场合使用，以免泄露个人信息
- 请勿在敏感信息上使用，以免泄露隐私
- 请勿在非法信息上使用，以免违法
- 请勿在不当信息上使用，以免影响他人
