# 双人协作说明

## 1. 第一次设置

1. 在 GitHub 新建一个私有仓库，例如 `style-mate`。
2. 两位成员都接受仓库邀请，并启用双重验证。
3. 每个人用 GitHub Desktop 克隆仓库，或使用 Git 命令克隆。
4. 默认分支使用 `main`，禁止直接向 `main` 推送未审核代码。

## 2. 分工边界

### A：产品体验与客户端

- 页面框架和导航
- 移动端布局
- 上传衣服表单和衣橱展示
- 身材档案页面
- 推荐结果卡片
- 穿搭日历和收藏
- 空状态、错误提示、加载状态

### B：AI 与内容能力

- 衣物识别接口
- 身材照片识别适配层
- 推荐 Agent 和提示词
- 穿搭知识库和标签
- 小红书链接灵感模块
- AI 返回结果适配器
- Mock Provider 和 API 失败降级

### 两人共同

- 产品范围和字段定义
- 用户测试
- 隐私、版权和平台规则
- 参赛笔记、演示录屏和最终发布

## 3. 分支命名

每个功能建立自己的分支，不直接改 `main`：

```text
feature/wardrobe-upload
feature/body-profile
feature/recommendation-agent
feature/outfit-calendar
fix/mobile-layout
```

分支名称使用英文小写和短横线，能看出它解决什么问题。

## 4. 每个功能的标准流程

1. 在 GitHub Issues 创建任务，写清楚目标和验收标准。
2. 从最新 `main` 创建功能分支。
3. 先让 VibeCoding 工具阅读项目并给出修改计划。
4. 要求它只修改本任务涉及的文件。
5. 本地运行并按验收路径测试。
6. 提交一个小而完整的 commit。
7. 推送分支，创建 Pull Request。
8. 另一位成员检查界面、数据流、隐私和错误处理。
9. 通过后合并到 `main`，删除已完成分支。

## 5. Commit 建议

一次 commit 只表达一个变化：

```text
feat: add wardrobe upload form
feat: add mock outfit recommendation
fix: handle empty wardrobe state
docs: update setup instructions
```

不要使用 `final`、`修改一下`、`各种更新` 这类无法说明内容的提交信息。

## 6. 两人必须先约定的接口

前端和 AI 模块都依赖以下稳定结构。字段需要变更时，先在 PR 中说明，不要默默改名。

```text
userProfile
- height
- weight
- bodyType
- features
- fitPreference

wardrobeItem
- id
- name
- category
- color
- material
- scene
- imageUrl

outfitRecommendation
- outfitTitle
- items
- reason
- fitTips
- alternatives
- sourceLinks
```

AI 供应商可以更换，但客户端只读取 `outfitRecommendation`，不读取某个供应商的原始响应。

## 7. VibeCoding 提示词模板

### 写代码前

```text
请先阅读当前项目，不要立即改代码。
本次任务是：________。
验收标准是：________。
只允许修改：________。
不得改变的接口或行为是：________。
请先列出文件、数据流和风险，等待确认后再实现。
```

### 代码完成后

```text
请只检查本次变更，不要直接改代码。
请按阻断问题、体验问题、隐私或版权风险、可选优化分类。
重点检查：移动端布局、空数据、重复点击、接口失败和数据是否泄露。
```

## 8. 合并前检查清单

- 新用户能否从入口走完主流程？
- 手机宽度下是否没有横向滚动或遮挡？
- 空衣橱、没有身材数据和 AI 失败时是否有提示？
- 图片是否限制格式和大小？
- API Key 是否只存在本地环境变量或部署平台变量？
- 是否把用户照片、身材数据或小红书原帖内容提交进仓库？
- 是否提供 Mock 模式，方便没有 API Key 时演示？
- PR 描述是否包含测试步骤和已知限制？

## 9. 推荐的 Issue 列表

- 建立移动端首页和导航
- 完成衣服上传与衣橱卡片
- 完成身材分类和特征选择
- 增加拍照识别 Mock 流程
- 设计 AI 推荐 Agent 输入输出
- 接入外部视觉 / 文本模型
- 增加小红书帖子链接灵感卡片
- 增加穿搭日历保存和删除
- 完成移动端真机测试
- 制作参赛录屏和发布笔记

