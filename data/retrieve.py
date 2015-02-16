import json
import requests
import csvkit
import StringIO
import os

script_path = os.path.dirname(os.path.realpath(__file__))

with open(os.path.join(script_path, 'stations.json')) as f:
    stations = json.loads(f.read())
stations

csv_url = "http://cdec.water.ca.gov/cgi-progs/queryCSV"

for station in stations:
    station_id = station['ID']

    print 'Retrieving ' + station['Station Name']

    r = requests.get(csv_url, params={
        'station_id' : station_id,
        'dur_code' : 'M',               # monthly
        'sensor_num' : 15,              # reservoir storage
        'start_date' : '1901/01/01',
    })

    if not r.text.startswith('Title'):
        # we got an error page
        print station['Station Name'] + ' failed to read'
        continue

    out = StringIO.StringIO(r.text)
    reader = csvkit.reader(out)
    station_data = {}

    # first two rows are headers
    reader.next()
    reader.next()

    for r in reader:
        station_data[r[0]] = float(r[2]) if r[2] != 'm' else r[2]

    station['storage'] = station_data

    print 'Completed ' + station['Station Name']

with open(os.path.join(script_path, 'station_data.json'), 'w+') as f:
    f.write(json.dumps({'stations' : stations}, sort_keys=True))
