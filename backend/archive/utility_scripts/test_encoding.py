import pandas as pd

file_path = r'C:\Users\beltr\Dropbox\LLM Mapping\New folder\Mapping Master.10152015.v2.csv'
encodings = ['latin-1', 'cp1252', 'iso-8859-1', 'windows-1252', 'utf-8-sig']

for enc in encodings:
    try:
        df = pd.read_csv(file_path, encoding=enc)
        print(f'SUCCESS with {enc}: {df.shape[0]} rows, {df.shape[1]} columns')
        print('Columns:', df.columns.tolist()[:5])
        print('First row sample:', df.iloc[0].to_dict())
        break
    except Exception as e:
        print(f'FAILED with {enc}: {str(e)[:50]}...')


