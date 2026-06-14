# 🌐 Codex风格 · 科技感频道开场动画

> 用于VSCode DeepSeek。输出独立HTML文件：`百大科创H5/intro.html`
> 动画播放5秒后循环，点任意位置跳转到 `index.html`

---

## 粘贴以下内容到VSCode DeepSeek

````
【任务：Codex风格科技感频道开场动画】

输出一个独立HTML文件 `intro.html`，放在 百大科创H5/ 下。
纯Three.js + 原生JS，通过CDN importmap引入，零外部资源。
动画持续5秒循环，点击任意位置跳转到 index.html。

---

## 一、技术依赖

```html
<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three@0.160.0/build/three.module.js"
  }
}
</script>
```

## 二、场景视觉规格

### 2.1 背景
- 深空背景：`renderer.setClearColor(0x010118)`
- 1000个星空粒子散布在大球体(半径6)上，白色/淡蓝，大小0.01-0.04，闪烁（alpha随机波动）
- 可选：y=-3处半透明网格地面，opacity 0.08

### 2.2 核心球体（能量核）
- 使用 `SphereGeometry(0.15, 64, 64)` + 自发光材质
- 基础颜色 `#33aaff` → `#aa44ff` 渐变（用ShaderMaterial或两个嵌套球体）
- 实际做法：两个同心球体
  - 内球：半径0.12，`MeshBasicMaterial` 白色，opacity 0.9
  - 外球：半径0.18，`MeshBasicMaterial` #8844ff，opacity 0.3，半透明光晕
- 脉冲动画：整体scale在 1.0 → 1.06 → 1.0 之间呼吸，周期1.2秒，easeInOutSine
- 额外：一个大的外光晕球体（半径0.35，#3388ff，opacity 0.08）同时脉冲

### 2.3 光环系统（至少4层）

使用 `TorusGeometry(radius, tube, 16, 100)` 实现：

| 光环 | 半径 | 管径 | 颜色 | 倾斜角(rotation.x) | 自转速度(rad/s) | 额外 |
|------|------|------|------|--------------------|------------------|------|
| 环1 水平 | 0.55 | 0.012 | #33ccff 蓝 | 0 (水平) | 0.8 | 带扫描线 |
| 环2 倾斜 | 0.70 | 0.010 | #ff66aa 洋红 | Math.PI/4 (45°) | -0.6 | 带扫描线 |
| 环3 垂直 | 0.85 | 0.008 | #88ffaa 青绿 | Math.PI/2.3 (~78°) | 0.5 | 无扫描线 |
| 环4 混合 | 1.00 | 0.006 | #ffaa44 橙金 | -Math.PI/3.5 | -0.4 | 无扫描线 |

**光环材质**：`MeshBasicMaterial`，emissive同色，transparent=true，opacity=0.7

**自转实现**：在render loop中，每个光环绕自身Z轴旋转 `ring.rotation.z += speed * deltaTime`

### 2.4 扫描线效果
环1和环2各带一条扫描线。做法：
- 每个带扫描线的光环，额外创建一个半径略小的Torus（管径0.018，略粗），颜色更亮（#ffffff 或亮色），opacity 0.4
- 这个"扫描环"在render loop中绕自身Z轴以3倍速度旋转（产生掠过效果）
- 扫描环的opacity还有一个sin波动：`0.3 + 0.3 * Math.sin(time * 4)`，周期2秒

### 2.5 粒子尘埃环
在核心周围（半径0.3-0.5），200个微小粒子（PointsMaterial，size=0.015，color=#33aaff）绕Y轴旋转，形成"行星环"效果。粒子在一个扁平的Torus区域内随机分布。整体绕Y轴缓慢旋转（0.25 rad/s）。

---

## 三、相机与视角

- PerspectiveCamera, fov=55, position=(0, 0.3, 2.8), lookAt(0, 0, 0)
- 轻微上下浮动：`camera.position.y = 0.3 + 0.02 * Math.sin(time * 1.3)`
- 极微小的推拉：`camera.position.z = 2.8 + 0.04 * Math.sin(time * 0.7)`
- 保持lookAt原点

---

## 四、动画时间线

```
0.0s ───────────────────────────────────────────── 5.0s ─→ 循环
│                                                      │
├─ 核心球体: 持续脉冲呼吸 (周期1.2s)
├─ 4个光环: 各自匀速自转
├─ 扫描环: 3x速度旋转 + alpha波动
├─ 背景星空: 随机闪烁
├─ 尘埃环: 缓速绕Y轴旋转
├─ 相机: 上下+推拉浮动
│
└─ 所有动画使用 time % period 实现无缝循环
```

动画循环结构：
```js
var clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  var t = clock.getElapsedTime() % 5; // 5秒循环
  var dt = Math.min(clock.getDelta(), 0.1);
  
  updateCorePulse(t);
  updateRings(dt);
  updateScanLines(t);
  updateStarField(t);
  updateDustRing(dt);
  updateCamera(t);
  
  renderer.render(scene, camera);
}
```

---

## 五、灯光

- 一个 `AmbientLight(0x222244, 0.5)` 提供基础照明
- 一个 `PointLight(0x3388ff, 30, 3)` 放在原点，给光环和球体提供主光
- 可选：第二个 `PointLight(0xff4488, 15, 2.5)` 偏移位置(0, -0.5, 1)，增加色彩层次

注意：光环使用MeshBasicMaterial不受灯光影响（自发光），灯光主要影响球体和其他非basic材质。

---

## 六、交互

- 点击任意位置：页面淡出(opacity 0→1, 0.6s) → 跳转 `window.location.href = 'index.html'`
- 页面底部居中显示半透明提示文字 "点击任意位置进入" ，opacity 0.5，12px，letter-spacing:3px

---

## 七、性能

- 星空粒子：1000个 PointsMaterial
- 尘埃环粒子：200个 PointsMaterial
- 光环：4个TorusGeometry（每个约1600顶点），总顶点数 < 10000
- 球体：2-3个SphereGeometry
- 总体三角面 < 50000，移动端也能跑30fps+
- 移动端检测：`window.innerWidth < 768` 时减少星空粒子到500个

---

## 八、输出要求

输出单个文件 `intro.html`，包含：
- 完整HTML结构 + 内嵌 `<style>` 标签
- `<script type="importmap">` 引入Three.js
- `<script type="module">` 内所有JS代码
- 代码注释清晰：场景搭建/光环创建/动画循环/交互 四个区块标注
- 文件路径：`百大科创H5/intro.html`
- 与主项目 `index.html` 同级

CSS：
```css
* { margin:0; padding:0; box-sizing:border-box; }
body { background:#010118; overflow:hidden; cursor:pointer; font-family:'Inter',sans-serif; }
canvas { display:block; }
.hint { position:fixed; bottom:40px; left:50%; transform:translateX(-50%);
  color:rgba(255,255,255,0.5); font-size:12px; letter-spacing:3px;
  pointer-events:none; animation: fadeHint 3s ease-in-out infinite; }
@keyframes fadeHint { 0%,100%{opacity:0.3} 50%{opacity:0.7} }
```
````
