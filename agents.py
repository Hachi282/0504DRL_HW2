import numpy as np
import random

class BaseAgent:
    def __init__(self, action_space, alpha=0.5, gamma=1.0, epsilon=0.1):
        self.action_space = action_space
        self.alpha = alpha
        self.gamma = gamma
        self.epsilon = epsilon
        self.q_table = {}

    def get_q_value(self, state, action):
        return self.q_table.get((state, action), 0.0)

    def choose_action(self, state):
        if random.uniform(0, 1) < self.epsilon:
            return random.choice(self.action_space)
        else:
            q_values = [self.get_q_value(state, a) for a in self.action_space]
            max_q = max(q_values)
            # Tie-breaking randomly among max values
            best_actions = [a for a, q in zip(self.action_space, q_values) if q == max_q]
            return random.choice(best_actions)

class QLearningAgent(BaseAgent):
    def update(self, state, action, reward, next_state, next_action_not_used):
        # Q-learning is off-policy: uses max Q(S', a')
        next_q_values = [self.get_q_value(next_state, a) for a in self.action_space]
        max_next_q = max(next_q_values) if next_q_values else 0.0
        
        current_q = self.get_q_value(state, action)
        new_q = current_q + self.alpha * (reward + self.gamma * max_next_q - current_q)
        self.q_table[(state, action)] = new_q


class SarsaAgent(BaseAgent):
    def update(self, state, action, reward, next_state, next_action):
        # SARSA is on-policy: uses Q(S', A')
        next_q = self.get_q_value(next_state, next_action)
        
        current_q = self.get_q_value(state, action)
        new_q = current_q + self.alpha * (reward + self.gamma * next_q - current_q)
        self.q_table[(state, action)] = new_q
