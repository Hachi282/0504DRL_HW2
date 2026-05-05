// Environment setup
const ROWS = 4;
const COLS = 12;
const START_STATE = { r: 3, c: 0 };
const GOAL_STATE = { r: 3, c: 11 };

// Actions: 0: UP, 1: RIGHT, 2: DOWN, 3: LEFT
const ACTIONS = [0, 1, 2, 3];
const ACTION_SYMBOLS = { 0: '↑', 1: '→', 2: '↓', 3: '←' };

function isCliff(r, c) {
    return r === 3 && c > 0 && c < 11;
}

class CliffWalkingEnv {
    constructor() {
        this.reset();
    }

    reset() {
        this.state = { ...START_STATE };
        return this.state;
    }

    step(action) {
        let next_r = this.state.r;
        let next_c = this.state.c;

        if (action === 0) next_r = Math.max(0, this.state.r - 1);
        else if (action === 1) next_c = Math.min(COLS - 1, this.state.c + 1);
        else if (action === 2) next_r = Math.min(ROWS - 1, this.state.r + 1);
        else if (action === 3) next_c = Math.max(0, this.state.c - 1);

        let reward = -1;
        let done = false;
        let next_state = { r: next_r, c: next_c };

        if (isCliff(next_r, next_c)) {
            reward = -100;
            next_state = { ...START_STATE };
            done = false;
        } else if (next_r === GOAL_STATE.r && next_c === GOAL_STATE.c) {
            reward = -1;
            done = true;
        }

        this.state = next_state;
        return { next_state, reward, done };
    }
}

class RLAgent {
    constructor(alpha, gamma, epsilon) {
        this.alpha = alpha;
        this.gamma = gamma;
        this.epsilon = epsilon;
        this.qTable = new Map(); // key: "r,c,a"
    }

    getQ(r, c, a) {
        const key = `${r},${c},${a}`;
        return this.qTable.has(key) ? this.qTable.get(key) : 0.0;
    }

    setQ(r, c, a, val) {
        this.qTable.set(`${r},${c},${a}`, val);
    }

    chooseAction(r, c) {
        if (Math.random() < this.epsilon) {
            return Math.floor(Math.random() * 4);
        } else {
            let maxQ = -Infinity;
            let bestActions = [];
            for (let a of ACTIONS) {
                const q = this.getQ(r, c, a);
                if (q > maxQ) {
                    maxQ = q;
                    bestActions = [a];
                } else if (q === maxQ) {
                    bestActions.push(a);
                }
            }
            return bestActions[Math.floor(Math.random() * bestActions.length)];
        }
    }

    getGreedyAction(r, c) {
        let maxQ = -Infinity;
        let bestAction = 0;
        for (let a of ACTIONS) {
            const q = this.getQ(r, c, a);
            if (q > maxQ) {
                maxQ = q;
                bestAction = a;
            }
        }
        return bestAction;
    }
}

class QLearningAgent extends RLAgent {
    update(r, c, action, reward, next_r, next_c, next_action) {
        let maxNextQ = -Infinity;
        for (let a of ACTIONS) {
            maxNextQ = Math.max(maxNextQ, this.getQ(next_r, next_c, a));
        }
        const currentQ = this.getQ(r, c, action);
        const newQ = currentQ + this.alpha * (reward + this.gamma * maxNextQ - currentQ);
        this.setQ(r, c, action, newQ);
    }
}

class SarsaAgent extends RLAgent {
    update(r, c, action, reward, next_r, next_c, next_action) {
        const nextQ = this.getQ(next_r, next_c, next_action);
        const currentQ = this.getQ(r, c, action);
        const newQ = currentQ + this.alpha * (reward + this.gamma * nextQ - currentQ);
        this.setQ(r, c, action, newQ);
    }
}

// UI State
let env = new CliffWalkingEnv();
let agent = null;
let currentAlgorithm = 'qlearning';
let trainingInterval = null;
let steppingInterval = null;
let currentEpisode = 0;
let lastReward = 0;

// DOM Elements
const gridEl = document.getElementById('grid');
const episodesInput = document.getElementById('episodes');
const epsValEl = document.getElementById('episodes-val');
const epsilonInput = document.getElementById('epsilon');
const epsilonValEl = document.getElementById('epsilon-val');
const alphaInput = document.getElementById('alpha');
const alphaValEl = document.getElementById('alpha-val');
const algoRadios = document.getElementsByName('algorithm');
const statEpisode = document.getElementById('stat-episode');
const statReward = document.getElementById('stat-reward');

const btnTrain = document.getElementById('btn-train');
const btnStep = document.getElementById('btn-step');
const btnReset = document.getElementById('btn-reset');

// Initialize UI
function initGrid() {
    gridEl.innerHTML = '';
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `cell-${r}-${c}`;

            if (r === START_STATE.r && c === START_STATE.c) cell.classList.add('start');
            else if (r === GOAL_STATE.r && c === GOAL_STATE.c) cell.classList.add('goal');
            else if (isCliff(r, c)) cell.classList.add('cliff');

            const arrow = document.createElement('span');
            arrow.className = 'arrow';
            arrow.id = `arrow-${r}-${c}`;
            cell.appendChild(arrow);

            gridEl.appendChild(cell);
        }
    }

    // Add agent dot
    const agentDot = document.createElement('div');
    agentDot.className = 'agent-dot';
    agentDot.id = 'agent-dot';
    gridEl.appendChild(agentDot);

    updateAgentPosition(START_STATE.r, START_STATE.c);
}

function updateAgentPosition(r, c) {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => cell.classList.remove('has-agent'));

    const targetCell = document.getElementById(`cell-${r}-${c}`);
    if (targetCell) {
        targetCell.classList.add('has-agent');
        const agentDot = document.getElementById('agent-dot');
        // Calculate position based on cell offset
        agentDot.style.left = `${targetCell.offsetLeft + targetCell.offsetWidth / 2 - agentDot.offsetWidth / 2}px`;
        agentDot.style.top = `${targetCell.offsetTop + targetCell.offsetHeight / 2 - agentDot.offsetHeight / 2}px`;
    }
}

function updateArrows() {
    if (!agent) return;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (isCliff(r, c) || (r === GOAL_STATE.r && c === GOAL_STATE.c)) continue;

            const arrowEl = document.getElementById(`arrow-${r}-${c}`);
            if (arrowEl) {
                const bestAction = agent.getGreedyAction(r, c);
                // Only show arrow if it has learned something (Q > or < 0)
                let hasLearned = false;
                for (let a of ACTIONS) {
                    if (agent.getQ(r, c, a) !== 0) hasLearned = true;
                }

                arrowEl.innerText = hasLearned ? ACTION_SYMBOLS[bestAction] : '';
            }
        }
    }
}

function resetAgent() {
    const alpha = parseFloat(alphaInput.value);
    const epsilon = parseFloat(epsilonInput.value);

    if (currentAlgorithm === 'qlearning') {
        agent = new QLearningAgent(alpha, 1.0, epsilon);
    } else {
        agent = new SarsaAgent(alpha, 1.0, epsilon);
    }

    env.reset();
    currentEpisode = 0;
    lastReward = 0;
    updateStats();
    updateAgentPosition(START_STATE.r, START_STATE.c);
    updateArrows();
}

function updateStats() {
    statEpisode.innerText = currentEpisode;
    statReward.innerText = lastReward;
}

// Training Logic
async function trainEpisodes(totalEpisodes) {
    btnTrain.disabled = true;
    btnStep.disabled = true;
    btnReset.disabled = true;

    for (let ep = 0; ep < totalEpisodes; ep++) {
        let state = env.reset();
        let action = agent.chooseAction(state.r, state.c);
        let done = false;
        let epReward = 0;
        let steps = 0;

        while (!done && steps < 1000) {
            const { next_state, reward, done: isDone } = env.step(action);
            const next_action = agent.chooseAction(next_state.r, next_state.c);

            agent.update(state.r, state.c, action, reward, next_state.r, next_state.c, next_action);

            state = next_state;
            action = next_action;
            epReward += reward;
            done = isDone;
            steps++;
        }

        currentEpisode++;
        lastReward = epReward;

        // Update UI every 50 episodes to avoid freezing
        if (ep % 50 === 0) {
            updateStats();
            updateArrows();
            await new Promise(resolve => setTimeout(resolve, 0)); // Yield to main thread
        }
    }

    updateStats();
    updateArrows();
    env.reset();
    updateAgentPosition(START_STATE.r, START_STATE.c);

    btnTrain.disabled = false;
    btnStep.disabled = false;
    btnReset.disabled = false;
}

async function singleStepDemo() {
    if (steppingInterval) return;

    btnTrain.disabled = true;
    btnStep.disabled = true;

    // Set epsilon to 0 for demo (Greedy)
    const oldEpsilon = agent.epsilon;
    agent.epsilon = 0;

    let state = env.reset();
    updateAgentPosition(state.r, state.c);
    let done = false;
    let epReward = 0;

    steppingInterval = setInterval(() => {
        if (done) {
            clearInterval(steppingInterval);
            steppingInterval = null;
            agent.epsilon = oldEpsilon;
            btnTrain.disabled = false;
            btnStep.disabled = false;
            return;
        }

        const action = agent.chooseAction(state.r, state.c);
        const result = env.step(action);

        state = result.next_state;
        epReward += result.reward;
        done = result.done;

        updateAgentPosition(state.r, state.c);

        // If fell off cliff, show it briefly then reset to start
        if (isCliff(state.r, state.c)) {
            setTimeout(() => updateAgentPosition(START_STATE.r, START_STATE.c), 200);
        }

    }, 200); // 200ms per step
}


// Event Listeners
episodesInput.addEventListener('input', e => epsValEl.innerText = e.target.value);
epsilonInput.addEventListener('input', e => {
    epsilonValEl.innerText = e.target.value;
    if (agent) agent.epsilon = parseFloat(e.target.value);
});
alphaInput.addEventListener('input', e => {
    alphaValEl.innerText = e.target.value;
    if (agent) agent.alpha = parseFloat(e.target.value);
});

algoRadios.forEach(radio => {
    radio.addEventListener('change', e => {
        currentAlgorithm = e.target.value;
        resetAgent();
    });
});

btnTrain.addEventListener('click', () => {
    const episodes = parseInt(episodesInput.value);
    trainEpisodes(episodes);
});

btnStep.addEventListener('click', singleStepDemo);

btnReset.addEventListener('click', resetAgent);

// Resize handling for agent dot
window.addEventListener('resize', () => {
    updateAgentPosition(env.state.r, env.state.c);
});

// Init
initGrid();
resetAgent();
