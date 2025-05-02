import pandas as pd

df = pd.read_csv('Dinesafe.csv')
df.drop_duplicates(inplace=True)
df.to_json('../netlify/functions/name_to_id.json', orient='records', indent=2, index=False)
