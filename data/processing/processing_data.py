import geopandas as gpd
import pandas as pd
import matplotlib.pyplot as plt
import rasterio
from rasterio.plot import show
from rasterio.plot import show_hist
from rasterio.mask import mask
import numpy as np

#----ACS Data----
#reading ACS data
acs_pop = pd.read_csv("data/raw/ACS_2022/pop_2022.csv") 
acs_housing = pd.read_csv("data/raw/ACS_2022/housing_2022.csv") 

#fixing index and transposing data
acs_housing = acs_housing.set_index('Label (Grouping)').T
acs_pop = acs_pop.set_index('Label (Grouping)').T

#renaming columns
acs_pop.columns = ['Population']
acs_housing.columns = ['Total Housing Units', 'Occupied Units', 'Vacant Units']

#joining data
acs_tract_data = pd.concat([acs_pop, acs_housing], axis=1)

# seperating moe and estimates
acs_moe = acs_tract_data.iloc[1::2]
acs_estimates = acs_tract_data.iloc[::2]

acs_moe = acs_moe.reset_index()
acs_estimates = acs_estimates.reset_index()

#clean up index names for acs estimates and moe
acs_estimates["index"] = (acs_estimates["index"].str.extract(r"Census Tract ([^;]+)")[0])

acs_moe["index"] = (acs_moe["index"].str.extract(r"Census Tract ([^;]+)")[0])

#rename columns
acs_estimates = acs_estimates.rename(columns={"index": "Tract"})
acs_moe = acs_moe.rename(columns={"index": "Tract"})

#turn data into numbers
cols_to_convert = ['Population', 'Total Housing Units', 'Occupied Units', 'Vacant Units']
acs_estimates[cols_to_convert] = acs_estimates[cols_to_convert].replace(',', '', regex=True)
acs_estimates[cols_to_convert] = acs_estimates[cols_to_convert].astype(int)

acs_moe[cols_to_convert] = acs_moe[cols_to_convert].replace(['±', ','], '', regex=True)
acs_moe[cols_to_convert] = acs_moe[cols_to_convert].astype(int)

# -----Census Tracts Data------

# processing CA census tracts
CA_tracts = gpd.read_file("data/raw/census_tracts/tl_2022_06_tract.shp")

# pick only ALameda county from CA tracts
Alameda_tracts = CA_tracts[CA_tracts["COUNTYFP"] == "001"] #Alameda county code = 001
Alameda_tracts = Alameda_tracts.reset_index(drop=True) #resetting index

#get rid of unnecessary columns
Alameda_tracts.drop(['STATEFP', 'COUNTYFP', 'MTFCC','FUNCSTAT', 'AWATER', 'INTPTLAT', 'INTPTLON'], axis=1, inplace=True)
Alameda_tracts = Alameda_tracts[~Alameda_tracts["NAME"].isin(["4443.03", "9900"])].copy()

Alameda_tracts = Alameda_tracts.reset_index(drop=True)

#turn number strings into ints
Alameda_tracts['ALAND'] = Alameda_tracts['ALAND'].astype(int)
Alameda_tracts['ALAND'] = Alameda_tracts['ALAND'] / 1_000_000 #converting land area from m^2 to km^2

acs_estimates["Tract"] = acs_estimates["Tract"].str.strip()
Alameda_tracts["NAME"] = Alameda_tracts["NAME"].str.strip()
#join census tract data with acs estimates and moe
census_and_acs_estimates = gpd.GeoDataFrame(acs_estimates.join(Alameda_tracts.set_index('NAME'), how='left', on='Tract'), geometry='geometry', crs=Alameda_tracts.crs) #using this method to perserve geopands dataframe
census_and_acs_moe = gpd.GeoDataFrame(acs_moe.join(Alameda_tracts.set_index('NAME'), how='left', on='Tract'), geometry='geometry', crs=Alameda_tracts.crs)

census_and_acs_estimates = census_and_acs_estimates[~census_and_acs_estimates["Tract"].isin(["4443.03", "9900"])].copy()

census_and_acs_estimates = census_and_acs_estimates.reset_index(drop=True)

# census_and_acs_estimates = census_and_acs_estimates.drop([324, 378]) #dont have people or housing units, so dropping, tracts 4443.03 and 9900
# census_and_acs_moe = census_and_acs_moe.drop([324, 378])
# census_and_acs_estimates = census_and_acs_estimates.reset_index(drop=True)
# census_and_acs_moe = census_and_acs_moe.reset_index(drop=True)

# print(census_and_acs_estimates.columns)
#-----Heat Data-----

#opening avg temp max
tmax = rasterio.open('data/raw/heat/daymet_v4_tmax_annavg_na_2022.tif')

# changing Alameda tract geometries coords so they match daymet data
heat_tracts = Alameda_tracts.to_crs(crs=tmax.crs)

# extracting polygons from each tract of Alameda County
heat_geometry = heat_tracts.geometry.values

#making stats table for each heat factor, each row representing a Alameda tract
tmax_stats = heat_tracts[['GEOID', 'NAME', 'geometry']].copy()

stat_names = ['mean', 'median', 'standard deviation', 'min', 'max', 'pixel count']
tmax_stats[stat_names] = None
for tract in range(tmax_stats.shape[0]):
    tract_img, transform = mask(dataset=tmax, shapes=[tmax_stats.at[tract, 'geometry']], crop=True, filled=False, all_touched=True)
    tmax_stats.at[tract, 'mean'] = np.ma.mean(tract_img)
    tmax_stats.at[tract, 'median'] = np.ma.median(tract_img)
    tmax_stats.at[tract, 'standard deviation'] = np.ma.std(tract_img)
    tmax_stats.at[tract, 'min'] = np.ma.min(tract_img)
    tmax_stats.at[tract, 'max'] = np.ma.max(tract_img)
    tmax_stats.at[tract, 'pixel count'] = tract_img.count()

tmax_stats[stat_names] = tmax_stats[stat_names].astype(float)
    
#-----Air Quality Data-------

air_quality = rasterio.open('data/raw/air_quality/sdei-global-annual-gwr-pm2-5-modis-misr-seawifs-viirs-aod-v5-gl-04-2022-geotiff.tif')

aq_tracts = Alameda_tracts.to_crs(crs=air_quality.crs)

aq_geometry = aq_tracts.geometry.values

aq_img, aq_transform = mask(dataset=air_quality, shapes=aq_geometry, crop=True, filled=False)
aq_meta = air_quality.meta.copy()

aq_stats = aq_tracts[['GEOID', 'NAME', 'geometry']].copy()

aq_stats[['mean', 'median', 'standard deviation', 'min', 'max', 'pixel count']] = None
for tract in range(tmax_stats.shape[0]):
    tract_img, transform = mask(dataset=air_quality, shapes=[aq_stats.at[tract, 'geometry']], crop=True, filled=False, all_touched=True)
    aq_stats.at[tract, 'mean'] = np.ma.mean(tract_img)
    aq_stats.at[tract, 'median'] = np.ma.median(tract_img)
    aq_stats.at[tract, 'standard deviation'] = np.ma.std(tract_img)
    aq_stats.at[tract, 'min'] = np.ma.min(tract_img)
    aq_stats.at[tract, 'max'] = np.ma.max(tract_img)
    aq_stats.at[tract, 'pixel count'] = tract_img.count()

aq_stats[stat_names] = aq_stats[stat_names].astype(float)

