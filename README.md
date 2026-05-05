# Cliff Walking - Q-learning vs SARSA

這是一個強化學習（Reinforcement Learning）的經典作業，主要在「Cliff Walking」的環境下實作並比較兩種演算法：**Q-learning**（離策略, Off-policy）與 **SARSA**（同策略, On-policy）。

## 專案結構

- `cliff_walking.py`：實作 4x12 Gridworld 的環境邏輯（處理起點、終點與掉下懸崖的獎勵與重置機制）。
- `agents.py`：實作 `QLearningAgent` 與 `SarsaAgent`，兩者皆採用 $\epsilon$-greedy 進行動作探索。
- `main.py`：主程式。負責執行訓練流程、進行多次實驗取平均以繪製平滑的學習曲線，並在終端機輸出最終的貪婪（Greedy）策略路徑。
- `Report.md`：本次作業的詳細分析報告，包含效能比較、行為分析與理論討論。
- `learning_curve.png`：訓練產出的學習曲線圖檔。

## 執行方式

1. 確保已安裝必要的套件（如 Numpy 與 Matplotlib）：
   ```bash
   pip install numpy matplotlib
   ```

2. 執行主程式進行訓練：
   ```bash
   python main.py
   ```

3. 程式執行完畢後，將會在終端機印出兩種演算法學習到的最終路徑，並於目錄下生成 `learning_curve.png` 比較圖。

## 實驗結果摘要

- **Q-learning**：學到了理論上的最短路徑（沿著懸崖邊走）。但由於在訓練時必須保持探索（$\epsilon$-greedy），導致它經常失足掉入懸崖，在訓練期間的平均回報較低。這展現了其**冒險（Risk-seeking）**的特性。
- **SARSA**：學到了遠離懸崖的安全路徑（繞遠路）。因為它在更新價值時會把探索的風險考慮進去，寧可多走幾步以避免掉落懸崖的巨大懲罰，在訓練期間的平均回報與穩定性較高。這展現了其**保守（Risk-averse）**的特性。

詳細的比較與討論請參閱 [Report.md](Report.md)。
