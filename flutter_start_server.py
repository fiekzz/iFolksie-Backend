

# /\'.*\.ngrok-free.app\'/gm

import os
import re
import requests
import subprocess



try:
    response = requests.get("http://localhost:4040/api/tunnels/")
    data = response.json()
except requests.exceptions.RequestException as e:
    ls_output=subprocess.Popen(["ngrok", "http", "3000"])
    response = requests.get("http://localhost:4040/api/tunnels/")
except:
    print("Error in getting ngrok url")

ngrok_url: str = data['tunnels'][0]['public_url']

ngrok_url = ngrok_url.replace("https://", "")

# CHANGE TO YOUR FILE PATH
file_path = ""

with open(file_path, 'r') as file:
    filedata = file.read()
    
    filedata = re.sub(r'\'.*\.ngrok-free.app\'', f"'{ngrok_url}'", filedata)

with open(file_path, 'w') as file:
    file.write(filedata)