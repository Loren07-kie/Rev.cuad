# AulaVisión · Grimoire Lab
Guía interactiva de Python, OpenCV y formularios web inspirada en Black Clover, basada en las semanas 12 y 13 (2 al 13 de noviembre de 2026).

## Abrir
https://aulavision-lab-lorena.onrender.com

## Seis misiones
1. Listas, diccionarios y bucles con resultados ejecutados en Python.
2. Condicionales con controles de píxel y umbral.
3. Imágenes oficiales de Asta, Yuno y Noelle; lectura real de matrices.
4. Cuatro filtros OpenCV, comparador deslizante, inspección RGB, histograma y descarga PNG.
5. Formularios POST de saludo y cálculo, con referencia a los controladores Java de la semana 13.
6. Cuestionario con retroalimentación y progreso local.

Descarga el cuaderno Jupyter editable desde `/cuaderno.ipynb` o abre `notebooks/mi_grimorio.ipynb`.

## Ejecutar localmente
Python 3.12 recomendado.
```sh
python -m venv .venv
# Activar el entorno virtual
pip install -r requirements.txt
python app.py
```
Abrir http://127.0.0.1:5000.

## Pruebas
```sh
python -m unittest discover -s tests -v
```
Nueve pruebas cubren filtros, imágenes reales de muestra, validación, celdas, descarga y sintaxis del cuaderno, formulario, calculadora y salud.

## Alcance
La web ejecuta operaciones concretas de Python mediante Flask. Las celdas de la guía muestran el código de cada operación; el código completo puede editarse en el archivo Jupyter descargable. Java aparece como referencia del ejercicio original de Spring Boot, no se ejecuta una JVM en la web.
No se entrena un modelo de IA. No hay registro de cuentas ni almacenamiento de imágenes en el servidor.
PNG/JPEG: hasta 8 MB y 8 megapíxeles. Las transparencias se componen sobre blanco. El progreso se guarda solo en el navegador.

## Despliegue
Render, servicio web Python, plan free, Oregon.
Build: `pip install -r requirements.txt`
Start: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --threads 2 --timeout 120`
Salud: `/health`.

## Recursos
Ver ASSETS.md para las fuentes oficiales de las ilustraciones y el prompt del logo generado.
Black Clover pertenece a sus respectivos titulares. Proyecto académico de fans no oficial y sin afiliación.
El informe académico está en la carpeta local documentos, fuera del repositorio público.