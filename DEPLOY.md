# Publicación en Render
Repositorio: https://github.com/Loren07-kie/Rev.cuad
Rama: main
Runtime: Python
Build: pip install -r requirements.txt
Start: gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --threads 2 --timeout 120
Plan: free
Región: Oregon
Salud: /health
