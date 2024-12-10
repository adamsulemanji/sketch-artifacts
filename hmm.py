import numpy as np
import pandas as pd
from datetime import datetime
from collections import defaultdict

class EmotionHMM:
    def __init__(self, n_states=6):  # 6 primary emotions
        self.n_states = n_states
        self.states = ["Happy", "Sad", "Angry", "Fear", "Disgust", "Surprise"]
        self.transition_matrix = np.zeros((n_states, n_states))
        self.emission_probs = defaultdict(lambda: defaultdict(float))
        self.initial_probs = np.zeros(n_states)
        
    def fit(self, data):
        # Convert timestamps to datetime
        data['Timestamp'] = pd.to_datetime(data['Timestamp'])
        
        # Sort by timestamp
        data = data.sort_values('Timestamp')
        
        # Count transitions between emotions
        transitions = defaultdict(lambda: defaultdict(int))
        emissions = defaultdict(lambda: defaultdict(int))
        initial_counts = defaultdict(int)
        
        # Process each participant separately
        for participant_id in data['Participant ID'].unique():
            participant_data = data[data['Participant ID'] == participant_id]
            
            # Count initial states
            first_emotion = participant_data.iloc[0]['Primary Emotion']
            initial_counts[first_emotion] += 1
            
            # Count transitions and emissions
            for i in range(len(participant_data) - 1):
                current_emotion = participant_data.iloc[i]['Primary Emotion']
                next_emotion = participant_data.iloc[i + 1]['Primary Emotion']
                secondary_emotions = str(participant_data.iloc[i]['Secondary Emotions'])
                
                transitions[current_emotion][next_emotion] += 1
                if secondary_emotions and secondary_emotions != 'nan':
                    emissions[current_emotion][secondary_emotions.strip()] += 1
        
        # Calculate probabilities
        # Initial probabilities
        total_initial = sum(initial_counts.values())
        for i, state in enumerate(self.states):
            self.initial_probs[i] = initial_counts[state] / total_initial if total_initial > 0 else 1/self.n_states
        
        # Transition probabilities
        for i, state1 in enumerate(self.states):
            total = sum(transitions[state1].values())
            for j, state2 in enumerate(self.states):
                self.transition_matrix[i][j] = transitions[state1][state2] / total if total > 0 else 1/self.n_states
        
        # Emission probabilities
        for state in self.states:
            total = sum(emissions[state].values())
            if total > 0:
                for secondary, count in emissions[state].items():
                    self.emission_probs[state][secondary] = count / total
    
    def predict_next_state(self, current_state):
        state_idx = self.states.index(current_state)
        transition_probs = self.transition_matrix[state_idx]
        next_state_idx = np.random.choice(self.n_states, p=transition_probs)
        return self.states[next_state_idx]
    
    def get_likely_secondary_emotions(self, state):
        emotions = sorted(self.emission_probs[state].items(), key=lambda x: x[1], reverse=True)
        return [emotion for emotion, prob in emotions[:3] if prob > 0]
    
    def get_recommendations(self, current_state):
        recommendations = {
            "Happy": ["Continue engaging in activities that bring joy",
                        "Share your positive emotions with others",
                        "Practice gratitude"],
            "Sad": ["Engage in gentle self-care activities",
                    "Reach out to supportive friends or family",
                    "Consider mindfulness or meditation"],
            "Angry": ["Take deep breaths",
                        "Try physical exercise to release tension",
                        "Practice emotion regulation techniques"],
            "Fear": ["Ground yourself using the 5-4-3-2-1 technique",
                    "Focus on what you can control",
                    "Consider talking to someone you trust"],
            "Disgust": ["Remove yourself from triggering situations if possible",
                        "Practice self-compassion",
                        "Focus on positive aspects"],
            "Surprise": ["Take time to process the unexpected",
                        "Journal about your experience",
                        "Share your experience with others"]
        }
        
        next_state = self.predict_next_state(current_state)
        secondary_emotions = self.get_likely_secondary_emotions(current_state)
        
        return {
            "current_state": current_state,
            "predicted_next_state": next_state,
            "likely_secondary_emotions": secondary_emotions,
            "current_recommendations": recommendations[current_state],
            "preparation_recommendations": recommendations[next_state]
        }

# Function to clean and prepare the data
def prepare_data(data):
    df = pd.DataFrame([row.split('\t') for row in data.split('\n')], columns=['Participant ID', 'Timestamp', 'Primary Emotion', 
                                                                            'Secondary Emotions', 'Event Details', 'Watch Tag',
                                                                            'Alcohol', 'Sickness', 'Mindfulness'])
    # Remove header row if present
    if df.iloc[0]['Participant ID'] == 'Participant ID':
        df = df.iloc[1:]
    
    # Clean timestamps
    df = df[df['Timestamp'] != '123456789']  # Remove invalid timestamps
    df['Timestamp'] = pd.to_datetime(df['Timestamp'])
    
    return df

# Example usage:
def analyze_emotions(data_string):
    # Prepare data
    df = prepare_data(data_string)
    
    # Create and fit HMM
    hmm = EmotionHMM()
    hmm.fit(df)
    
    # Get current state (most recent emotion)
    current_state = df.iloc[-1]['Primary Emotion']
    
    # Get recommendations
    recommendations = hmm.get_recommendations(current_state)
    return recommendations, hmm.transition_matrix, hmm.states