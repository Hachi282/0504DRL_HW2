import numpy as np
import matplotlib.pyplot as plt
from cliff_walking import CliffWalkingEnv
from agents import QLearningAgent, SarsaAgent

def train(agent, env, episodes):
    rewards = np.zeros(episodes)
    for ep in range(episodes):
        state = env.reset()
        action = agent.choose_action(state)
        total_reward = 0
        done = False
        
        while not done:
            next_state, reward, done = env.step(action)
            next_action = agent.choose_action(next_state)
            
            agent.update(state, action, reward, next_state, next_action)
            
            state = next_state
            action = next_action
            total_reward += reward
            
        # Optional: Clip the reward at -100 for better visualization as in Sutton & Barto
        # because an episode could potentially accumulate -1000s if it falls off repeatedly
        # Actually standard Sutton and Barto plots the average sum of rewards. 
        # But we'll leave it as is to reflect the true total reward or clip it if it gets too negative.
        # Let's clip at -100 just to match the graph y-axis scale if necessary.
        rewards[ep] = max(total_reward, -100) 
    return rewards

def print_policy(agent, env, name):
    print(f"\n--- {name} Policy ---")
    action_symbols = {0: 'U', 1: 'R', 2: 'D', 3: 'L'}
    for i in range(env.rows):
        row_str = ""
        for j in range(env.cols):
            state = (i, j)
            if state == env.start_state:
                row_str += " S "
            elif state == env.goal_state:
                row_str += " G "
            elif state in env.cliff:
                row_str += " C "
            else:
                best_action = max(env.action_space, key=lambda a: agent.get_q_value(state, a))
                row_str += f" {action_symbols[best_action]} "
        print(row_str)

import matplotlib.patches as patches

def plot_policy(agent, env, name, filename):
    fig, ax = plt.subplots(figsize=(12, 4))
    ax.set_xlim(0, env.cols)
    ax.set_ylim(0, env.rows)
    ax.set_xticks(np.arange(env.cols + 1))
    ax.set_yticks(np.arange(env.rows + 1))
    ax.grid(color='k', linestyle='-', linewidth=2)
    ax.invert_yaxis() # To make (0,0) at top-left
    
    ax.set_xticklabels([])
    ax.set_yticklabels([])
    ax.tick_params(axis='both', which='both', length=0)
    
    action_symbols = {0: '↑', 1: '→', 2: '↓', 3: '←'}
    
    for i in range(env.rows):
        for j in range(env.cols):
            state = (i, j)
            rect_x = j
            rect_y = i
            
            if state == env.start_state:
                ax.add_patch(patches.Rectangle((rect_x, rect_y), 1, 1, facecolor='lightblue'))
                ax.text(rect_x + 0.5, rect_y + 0.5, 'Start', ha='center', va='center', fontsize=12, weight='bold')
            elif state == env.goal_state:
                ax.add_patch(patches.Rectangle((rect_x, rect_y), 1, 1, facecolor='lightgreen'))
                ax.text(rect_x + 0.5, rect_y + 0.5, 'Goal', ha='center', va='center', fontsize=12, weight='bold')
            elif state in env.cliff:
                ax.add_patch(patches.Rectangle((rect_x, rect_y), 1, 1, facecolor='grey'))
                ax.text(rect_x + 0.5, rect_y + 0.5, 'Cliff', ha='center', va='center', fontsize=12, weight='bold', color='white')
            else:
                best_action = max(env.action_space, key=lambda a: agent.get_q_value(state, a))
                ax.text(rect_x + 0.5, rect_y + 0.5, action_symbols[best_action], ha='center', va='center', fontsize=20)
                
    plt.title(f'{name} Policy')
    plt.savefig(filename, bbox_inches='tight')
    plt.close()
def main():
    runs = 50
    episodes = 500
    alpha = 0.5
    epsilon = 0.1
    
    q_learning_rewards = np.zeros((runs, episodes))
    sarsa_rewards = np.zeros((runs, episodes))
    
    print("Starting Training...")
    
    for r in range(runs):
        print(f"Run {r+1}/{runs}", end="\r")
        
        # Train Q-learning
        env = CliffWalkingEnv()
        q_agent = QLearningAgent(env.action_space, alpha=alpha, epsilon=epsilon)
        q_learning_rewards[r] = train(q_agent, env, episodes)
        
        # Train SARSA
        env = CliffWalkingEnv()
        sarsa_agent = SarsaAgent(env.action_space, alpha=alpha, epsilon=epsilon)
        sarsa_rewards[r] = train(sarsa_agent, env, episodes)
        
    print("\nTraining Finished!")
    
    # Average rewards over runs
    q_avg_rewards = np.mean(q_learning_rewards, axis=0)
    sarsa_avg_rewards = np.mean(sarsa_rewards, axis=0)
    
    # Print Policies from the last run
    print_policy(q_agent, env, "Q-Learning")
    print_policy(sarsa_agent, env, "SARSA")
    
    # Plot Policies
    plot_policy(q_agent, env, "Q-Learning", "q_learning_policy.png")
    plot_policy(sarsa_agent, env, "SARSA", "sarsa_policy.png")
    print("Policy visualizations saved as 'q_learning_policy.png' and 'sarsa_policy.png'.")
    
    # Plotting
    plt.figure(figsize=(10, 6))
    plt.plot(sarsa_avg_rewards, label='SARSA', color='c')
    plt.plot(q_avg_rewards, label='Q-learning', color='r')
    plt.xlabel('Episodes')
    plt.ylabel('Sum of rewards during episode')
    plt.title('SARSA vs Q-Learning on Cliff Walking')
    plt.ylim([-100, 0])
    plt.legend()
    plt.grid()
    plt.savefig('learning_curve.png')
    print("\nLearning curve saved as 'learning_curve.png'.")

if __name__ == "__main__":
    main()
