from data.processing import processing_data
from data.processing import analysis
import pandas as pd
from sqlalchemy import create_engine, text

engine = create_engine(
    "postgresql://fernandabarraza@localhost:5432/infra_stress"
)

with engine.begin() as connection:
    connection.execute(text("""
        TRUNCATE TABLE
            stress_scores,
            heat_stats,
            air_quality_stats,
            tracts
        CASCADE;
    """))

with engine.connect() as connection:
    result = connection.execute(text("SELECT 1"))
    print(result.fetchone())

gdf = processing_data.census_and_acs_estimates

processing_data.census_and_acs_estimates.to_postgis(
    name="tracts",
    con=engine,
    if_exists="append",
    index=False
)

analysis.stress_data.to_sql(
    name="stress_scores",
    con=engine,
    if_exists="append",
    index=False
)

heat_data = processing_data.tmax_stats[["GEOID", "mean", "median", "standard deviation", "min", "max","pixel count"]]

heat_data.to_sql(
       name="heat_stats",
       con=engine,
       if_exists="append",
       index=False
   )
    
aq_data = processing_data.aq_stats[["GEOID", "mean", "median", "standard deviation", "min", "max","pixel count"]]

aq_data.to_sql(
      name="air_quality_stats",
      con=engine,
      if_exists="append",
      index=False
  )
#print(analysis.tmax_stats.columns)