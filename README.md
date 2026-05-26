# Life Dashboard · 生活仪表盘

一个用 Vue 3 + Vite 写的"生活仪表盘"小项目，集成：

- 🌤 **天气预报**：基于 Open-Meteo 免费 API（无需 Key），自动定位 + 城市搜索 + 5 日预报 + 24 小时温度曲线
- 📅 **日历 & 农历**：月历视图，集成农历、节气、黄历宜忌，标记法定节假日和调休
- 🎉 **节假日倒计时**：内置 2026 年中国法定节假日，显示距离最近假期还有几天
- 🌴 **周末倒计时**：精确到秒地告诉你离周六还有多久
- 💰 **发薪日倒计时**：支持多日期切换，显示距离下次发薪还有多久
- 💕 **纪念日手册**：记录生日、恋爱纪念日等特殊日子，带浪漫语录与心跳动画
- 💗 **爱心雨特效**：页面加载时的浪漫入场动画
- ✨ 玻璃拟态 / 渐变背景 / 响应式布局

## 启动方式

```bash
npm install
npm run dev
```

打开浏览器访问 http://localhost:5173 即可。

## 构建

```bash
npm run build
npm run preview
```

## 部署到 GitHub Pages

仓库里已经配好了 `.github/workflows/deploy.yml`，push 到 `main` 分支会自动构建并部署。

**首次部署步骤：**

1. 在 GitHub 新建一个仓库（比如 `life-dashboard`），不要勾选任何初始化选项
2. 在本地把项目 push 上去：
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/<仓库名>.git
   git push -u origin main
   ```
3. 打开仓库的 **Settings → Pages**，把 "Source" 切到 **GitHub Actions**
4. 回到仓库的 **Actions** 标签页，会看到 workflow 正在跑，几十秒后完成
5. 访问 `https://<你的用户名>.github.io/<仓库名>/` 即可看到页面

之后每次 `git push`，Pages 会自动更新。

**注意：**
- `vite.config.js` 里的 `base` 会从环境变量 `VITE_BASE` 读取，本地 dev 是 `/`，CI 部署时会被自动设成 `/<仓库名>/`
- 如果你想换成自定义域名，在仓库根目录加一个 `CNAME` 文件，内容写你的域名即可

## 目录结构

```
src/
├── App.vue                        # 主页面 + 顶部时间问候
├── main.js
├── style.css                      # 全局样式（玻璃、渐变）
├── assets/
│   └── anniversary.jpg            # 纪念日背景图
├── components/
│   ├── Weather.vue                # 天气预报（5日预报 + 24h 曲线）
│   ├── Holidays.vue               # 节假日倒计时（含日历组件）
│   ├── Calendar.vue               # 日历组件（农历 / 节气 / 黄历宜忌）
│   ├── WeekendCard.vue            # 周末倒计时
│   ├── Payday.vue                 # 发薪日倒计时
│   ├── AnniversaryBook.vue        # 纪念日手册（语录 + 心跳）
│   └── HeartRain.vue              # 爱心雨入场动画
└── composables/
    ├── useHolidays.js             # 节假日数据（2026 年法定假期）
    └── useAnniversaries.js        # 纪念日数据与查询
```

## 备注

- 天气接口为 [Open-Meteo](https://open-meteo.com/)，免费、无 Key、支持 CORS。
- 节假日数据写在 `composables/useHolidays.js` 里，若官方调整放假安排，请同步修改 `HOLIDAYS_2026` 数组。
- 纪念日数据写在 `composables/useAnniversaries.js` 里，可自行增改。
- 退休年龄默认按现行渐进式延迟退休方案（男 63 / 女干部 58 / 女工人 55），可手动自定义。
