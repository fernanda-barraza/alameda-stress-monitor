Alameda Stress Monitor

An interactive geospatial analytics platform for exploring environmental, demographic, and housing-related stress across census tracts in Alameda County, California.

The project combines U.S. Census demographic and housing data with climate and air-quality data to produce a tract-level Stress Score, allowing users to explore how different factors vary geographically across Alameda County.

Status: In active development — core data processing, scoring, API, and interactive map are implemented. Additional visualization and statistical features are currently being developed.

Overview

Communities experience environmental and socioeconomic stress through a combination of factors rather than a single measurement. The Alameda Stress Monitor brings several of these dimensions together into one interactive map.

The platform currently incorporates:

Population density
Housing density
Annual maximum temperature
PM2.5 air-pollution levels
Census tract demographic and housing data
A combined tract-level Stress Score

Users can explore individual census tracts and filter the map based on their calculated stress scores.

Features
Interactive Census Tract Map

Explore Alameda County at the census-tract level through an interactive map.

Each tract is associated with a calculated Stress Score, allowing users to identify geographic patterns and areas experiencing relatively higher or lower levels of measured stress.

Multi-Factor Stress Score

The Stress Score combines multiple environmental and demographic indicators into a single metric.

The underlying variables are transformed into percentile-based measures so that values across different units and scales can be compared and combined.

Current factors include:

Factor	Description
Population Density	Population relative to land area
Housing Density	Housing units relative to land area
Maximum Temperature	Average annual maximum temperature
PM2.5	Average particulate matter concentration
Stress Score	Combined score derived from the contributing indicators
Interactive Filtering

Users can filter census tracts based on Stress Score thresholds and explore how the geographic distribution changes.

Tract-Level Data

The platform maintains census-tract-level geographic and statistical information, allowing environmental measurements to be connected directly to demographic and housing characteristics.

Data Pipeline

The project includes a Python-based geospatial data-processing pipeline that prepares the datasets before they are consumed by the application.

The pipeline:

Collects demographic and housing data from the U.S. Census American Community Survey (ACS).
Processes Alameda County census tract boundaries.
Cleans and restructures ACS estimates and margins of error.
Processes gridded climate data to calculate tract-level temperature statistics.
Processes air-quality raster data to calculate tract-level PM2.5 statistics.
Aligns datasets using census tract identifiers.
Converts relevant measurements into percentile-based values.
Calculates a combined Stress Score.
Stores the processed data for use by the application's API.
Geospatial Processing

Climate and air-quality datasets are originally provided as raster/grid data rather than census-tract measurements.

To connect these datasets to census tracts, the pipeline performs spatial masking and aggregation to calculate tract-level statistics.

Current calculations include:

Mean
Median
Standard deviation
Minimum
Maximum

This allows raw environmental grids to be transformed into statistics that can be compared across census tracts.

Technology Stack
Frontend
React
Vite
JavaScript
React-Leaflet
Leaflet
CSS
Backend
Node.js
Express
PostgreSQL
PostGIS
Data Processing
Python
Pandas
GeoPandas
Rasterio
NumPy
scikit-learn
Data Sources
U.S. Census Bureau — American Community Survey (ACS)
Census tract geographic boundaries
Daymet climate data
PM2.5 air-quality data
Current Development

The core application is functional, but the project is still actively being developed.

In Progress

Gradient Map Visualization

Replacing the current categorical map visualization with a continuous gradient to make spatial patterns and differences in Stress Score easier to identify.

Expanded Environmental Statistics

Adding additional tract-level statistics to the interface, including:

Temperature median
Temperature standard deviation
Temperature minimum / maximum
PM2.5 median
PM2.5 standard deviation
PM2.5 minimum / maximum

Improved Data Exploration

Expanding the tract information shown to users so that they can investigate the individual components contributing to a tract's overall Stress Score rather than only viewing the aggregate score.

UI / Visualization Refinements

Continuing to improve the visual design, map interactions, filtering experience, and overall usability of the application.

Future Improvements

Potential future additions include:

More environmental indicators
Additional demographic and socioeconomic variables
More detailed tract-level comparisons
Interactive charts for individual indicators
Historical data and year-over-year comparisons
Improved statistical visualizations
More flexible scoring methodologies
Additional geographic areas beyond Alameda County
Project Goals

Beyond creating a visualization, the goal is to build an end-to-end pipeline that demonstrates:

Development Status

This project is actively being built and refined.

The current version provides the foundation for an end-to-end geospatial analytics application, with additional visualization, statistics, and data-exploration features planned as development continues.
