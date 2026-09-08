from . import processing_data
import geopandas as gpd
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import numpy as np

# creating table that contains all main variables that will be used to calculate stress score
main_var = ['GEOID','Tract', 'Population Density', 'Housing Density', 'Avg Max Temp', 'Avg PM2.5 Levels']
stress_data = pd.DataFrame(columns=main_var)

# filling in each column
stress_data['GEOID'] = processing_data.census_and_acs_estimates['GEOID']
stress_data['Tract'] = processing_data.census_and_acs_estimates['Tract']
stress_data['Population Density'] = processing_data.census_and_acs_estimates['Population'] / processing_data.census_and_acs_estimates['ALAND']
stress_data['Housing Density'] = processing_data.census_and_acs_estimates['Total Housing Units'] / processing_data.census_and_acs_estimates['ALAND']
#stress_data['Vacancy Rate'] = processing_data.census_and_acs_estimates['Vacant Units'] / processing_data.census_and_acs_estimates['Total Housing Units']
stress_data['Avg Max Temp'] = processing_data.tmax_stats['mean']
stress_data['Avg PM2.5 Levels'] = processing_data.aq_stats['mean']

stress_data = stress_data[~stress_data["GEOID"].isin(["06001444303", "06001990000"])].copy()

#converting all stress_data into percentiles
stress_data['Population Density'] = stress_data['Population Density'].rank(pct=True) * 100
stress_data['Housing Density'] = stress_data['Housing Density'].rank(pct=True) * 100
stress_data['Avg Max Temp'] = stress_data['Avg Max Temp'].rank(pct=True) * 100
stress_data['Avg PM2.5 Levels'] = stress_data['Avg PM2.5 Levels'].rank(pct=True) * 100

#calculating stress score
stress_data['Stress Score'] = (stress_data['Population Density'] + stress_data['Housing Density'] + stress_data['Avg Max Temp'] + stress_data['Avg PM2.5 Levels']) / 4

# stress_data.to_csv('stress_data.csv')
#print(stress_data.columns)
