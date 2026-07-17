#!/bin/bash
# 羽迹·数据采集 (cron 版)
DATA_DIR="/var/www/html/birds/data"
mkdir -p "$DATA_DIR"

# iNaturalist
rm -f /tmp/_inat.json
curl -sL 'https://api.inaturalist.org/v1/observations?taxon_id=3&per_page=200&order=desc&order_by=created_at&nelat=54&nelng=135&swlat=18&swlng=73' \
  --max-time 300 -o /tmp/_inat.json 2>/dev/null
python3 << 'PYEOF'
import json
with open('/tmp/_inat.json') as f: d=json.load(f)
out=[{'lat':g[1],'lng':g[0],'label':o.get('taxon',{}).get('preferred_common_name') or o.get('taxon',{}).get('name','?'),'date':(o.get('observed_on_details',{}).get('date') or '').replace('-','/'),'source':'iNaturalist','count':1} for o in d.get('results',[]) if (g:=o.get('geojson',{}).get('coordinates'))]
with open('/var/www/html/birds/data/inaturalist.json','w') as f: json.dump(out,f,ensure_ascii=False)
print(f'iNaturalist: {len(out)}条')
PYEOF

# GBIF
curl -sL 'https://api.gbif.org/v1/occurrence/search?taxonKey=212&country=CN&limit=300&hasCoordinate=true' \
  --max-time 90 -o /tmp/_gbif.json 2>/dev/null
python3 << 'PYEOF'
import json
with open('/tmp/_gbif.json') as f: d=json.load(f)
out=[{'lat':r['decimalLatitude'],'lng':r['decimalLongitude'],'label':r.get('vernacularName') or r.get('species','?'),'date':(r.get('eventDate') or '').split('T')[0].replace('-','/'),'source':'GBIF','count':r.get('individualCount') or 1} for r in d.get('results',[]) if r.get('decimalLatitude') is not None]
with open('/var/www/html/birds/data/gbif.json','w') as f: json.dump(out,f,ensure_ascii=False)
print(f'GBIF: {len(out)}条')
PYEOF

# eBird
curl -sL 'https://api.ebird.org/v2/data/obs/CN/recent?maxResults=100' \
  -H 'X-eBirdApiToken: akg196iojfvr' --max-time 90 -o /tmp/_ebird.json 2>/dev/null
python3 << 'PYEOF'
import json
with open('/tmp/_ebird.json') as f: d=json.load(f)
out=[{'lat':r['lat'],'lng':r['lng'],'label':r['comName']+(' @ '+r['locName'] if r.get('locName') else ''),'date':r.get('obsDt',''),'source':'eBird','count':r.get('howMany') or 1} for r in d]
with open('/var/www/html/birds/data/ebird.json','w') as f: json.dump(out,f,ensure_ascii=False)
print(f'eBird: {len(out)}条')
PYEOF

echo "{\"updated\":\"$(date -Iseconds)\",\"errors\":[]}" > "$DATA_DIR/meta.json"
echo "=== 完成 ==="
