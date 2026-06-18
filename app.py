import urllib.request
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template

app = Flask(__name__)

ATOM_NAMESPACE = "http://www.w3.org/2005/Atom"
NAMESPACE_MAP = {"atom": ATOM_NAMESPACE}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/notes")
def get_notes():
    url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
    try:
        # Fetch xml
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
        
        # Parse XML
        root = ET.fromstring(xml_data)
        entries = []
        
        for entry in root.findall("atom:entry", NAMESPACE_MAP):
            title_el = entry.find("atom:title", NAMESPACE_MAP)
            id_el = entry.find("atom:id", NAMESPACE_MAP)
            updated_el = entry.find("atom:updated", NAMESPACE_MAP)
            link_el = entry.find("atom:link", NAMESPACE_MAP)
            content_el = entry.find("atom:content", NAMESPACE_MAP)
            
            title = title_el.text if title_el is not None else ""
            entry_id = id_el.text if id_el is not None else ""
            updated = updated_el.text if updated_el is not None else ""
            link = link_el.attrib.get("href", "") if link_el is not None else ""
            content = content_el.text if content_el is not None else ""
            
            entries.append({
                "title": title,
                "id": entry_id,
                "updated": updated,
                "link": link,
                "content": content
            })
            
        return jsonify({"success": True, "entries": entries})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
