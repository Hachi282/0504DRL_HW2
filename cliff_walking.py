import numpy as np

class CliffWalkingEnv:
    def __init__(self):
        self.rows = 4
        self.cols = 12
        self.start_state = (3, 0)
        self.goal_state = (3, 11)
        self.cliff = [(3, i) for i in range(1, 11)]
        
        # Actions: 0: UP, 1: RIGHT, 2: DOWN, 3: LEFT
        self.action_space = [0, 1, 2, 3]
        self.state = self.start_state

    def reset(self):
        self.state = self.start_state
        return self.state

    def step(self, action):
        i, j = self.state
        
        if action == 0:   # UP
            next_state = (max(i - 1, 0), j)
        elif action == 1: # RIGHT
            next_state = (i, min(j + 1, self.cols - 1))
        elif action == 2: # DOWN
            next_state = (min(i + 1, self.rows - 1), j)
        elif action == 3: # LEFT
            next_state = (i, max(j - 1, 0))
        else:
            raise ValueError("Invalid action")

        # Check conditions
        if next_state in self.cliff:
            reward = -100
            next_state = self.start_state
            done = False  # Cliff walking continues after falling into cliff, just back to start
        elif next_state == self.goal_state:
            reward = -1
            done = True
        else:
            reward = -1
            done = False
            
        self.state = next_state
        return next_state, reward, done

    def get_state_space(self):
        return [(i, j) for i in range(self.rows) for j in range(self.cols)]
