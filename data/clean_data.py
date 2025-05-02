import pandas as pd

df = pd.read_csv('Dinesafe.csv')
df.drop_duplicates(inplace=True)
df.to_csv('name_to_id.csv', index=False)
