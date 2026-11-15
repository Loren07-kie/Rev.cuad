# AulaVisión Lab
Proyecto de aplicación de las semanas 12 (2 al 6 de noviembre de 2026) y 13 (9 al 13 de noviembre de 2026).

## Funciones
- Carga PNG/JPEG (hasta 8 MB y 8 megapíxeles), comparación original/resultado y descarga PNG.
- Escala de grises, desenfoque gaussiano, Canny y umbral binario.
- Dimensiones, brillo medio, proporción de píxeles claros e histograma.
- Saludo personalizado y calculadora con validación.
- Interfaz adaptable para móvil y escritorio.

## Relación con los materiales
SEMANA 12.zip contiene fundamentos Python/NumPy, un esqueleto Flask incompleto y filtros OpenCV. Se completan las rutas y se corrige la conversión a gris del filtro Canny.
Saludo.rar corresponde a la semana 13: Java 21, Spring Boot, controladores POST, saludo, registro y suma.
Esta aplicación nueva integra en Flask el procesamiento de imágenes y los ejercicios de saludo/cálculo. No ejecuta Java ni ofrece registro de usuarios; no guarda datos personales ni contraseñas. No es un modelo entrenado de IA.

## Ejecutar
Python 3.11 o 3.12 recomendado.
```sh
python -m venv .venv
# Activar el entorno virtual según el sistema
pip install -r requirements.txt
python app.py
```
Abrir http://127.0.0.1:5000.

## Pruebas
```sh
python -m unittest discover -s tests -v
```

## Render
Servicio web Python, plan free, región Oregon.
Build: `pip install -r requirements.txt`
Start: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --threads 2 --timeout 120`
Endpoint: `/health`.
No requiere secretos, base de datos ni disco persistente.

## Documento
El informe académico se entrega por separado en la carpeta local documentos para evitar publicar el ID estudiantil o el contenido privado de los reportes en el repositorio público.
