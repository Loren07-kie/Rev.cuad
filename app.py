import base64
import io
import math
import warnings
import cv2
import numpy as np
from PIL import Image, UnidentifiedImageError
from flask import Flask, jsonify, render_template, request
from werkzeug.exceptions import RequestEntityTooLarge

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 9 * 1024 * 1024
Image.MAX_IMAGE_PIXELS = 8_000_000
FILTERS = {"grises": "Escala de grises", "gaussiano": "Desenfoque gaussiano", "bordes": "Detección de bordes", "umbral": "Blanco y negro"}

def encode(image):
    ok, data = cv2.imencode(".png", image)
    if not ok:
        raise ValueError("No se pudo generar la imagen.")
    return "data:image/png;base64," + base64.b64encode(data).decode()

def apply_filter(image, name, threshold=128):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    if name == "grises":
        return gray
    if name == "gaussiano":
        return cv2.GaussianBlur(image, (15, 15), 0)
    if name == "bordes":
        return cv2.Canny(cv2.GaussianBlur(gray, (5, 5), 0), 100, 200)
    if name == "umbral":
        return cv2.threshold(gray, threshold, 255, cv2.THRESH_BINARY)[1]
    raise ValueError("Selecciona un filtro válido.")

@app.get("/")
def index():
    return render_template("index.html", filters=FILTERS)

@app.get("/health")
def health():
    return jsonify(status="ok")

@app.errorhandler(RequestEntityTooLarge)
def too_large(error):
    return jsonify(error="La carga supera el límite permitido de 8 MB por imagen."), 413

@app.post("/api/imagen")
def process_image():
    upload = request.files.get("imagen")
    demo = request.form.get("demo")
    if (not upload or not upload.filename) and demo not in DEMO_FILES:
        return jsonify(error="Selecciona una imagen PNG o JPEG o un personaje."), 400
    try:
        name = request.form.get("filtro", "grises")
        if name not in FILTERS:
            raise ValueError("Selecciona un filtro válido.")
        threshold = int(request.form.get("umbral", 128))
        if not 0 <= threshold <= 255:
            raise ValueError("El umbral debe estar entre 0 y 255.")
        if demo in DEMO_FILES and (not upload or not upload.filename):
            image = load_demo(demo)
            height, width = image.shape[:2]
        else:
            raw = upload.read(8 * 1024 * 1024 + 1)
            if len(raw) > 8 * 1024 * 1024:
                raise ValueError("La imagen debe pesar como máximo 8 MB.")
            with warnings.catch_warnings():
                warnings.simplefilter("error", Image.DecompressionBombWarning)
                with Image.open(io.BytesIO(raw)) as source:
                    if source.format not in ("PNG", "JPEG"):
                        raise ValueError("Solo se admiten imágenes PNG o JPEG.")
                    width, height = source.size
                    if width * height > 8_000_000:
                        raise ValueError("La imagen debe tener como máximo 8 megapíxeles.")
                    rgba = source.convert("RGBA")
                    rgb = np.array(Image.alpha_composite(Image.new("RGBA", rgba.size, (255, 255, 255, 255)), rgba).convert("RGB"))
            image = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
        result = apply_filter(image, name, threshold)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        histogram = np.histogram(gray, bins=16, range=(0, 256))[0].tolist()
        return jsonify(original=encode(image), resultado=encode(result),
                       ancho=width, alto=height, brillo=round(float(gray.mean()), 1),
                       claros=round(float((gray >= threshold).mean()) * 100, 1),
                       histograma=histogram, filtro=FILTERS[name])
    except (ValueError, OSError, UnidentifiedImageError, Image.DecompressionBombError, Image.DecompressionBombWarning):
        return jsonify(error="Revisa la imagen (PNG/JPEG, hasta 8 MB y 8 MP), el filtro y el umbral de 0 a 255."), 400

@app.post("/api/saludo")
def greeting():
    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return jsonify(error="Envía un objeto con nombre y edad."), 400
    name = str(data.get("nombre", "")).strip()
    try:
        age = int(str(data.get("edad", "")))
        if not name or len(name) > 80 or not 0 <= age <= 120:
            raise ValueError()
    except ValueError:
        return jsonify(error="Escribe un nombre de hasta 80 caracteres y una edad entera entre 0 y 120."), 400
    return jsonify(mensaje=f"¡Hola, {name}! Tienes {age} años. Bienvenido a AulaVisión Lab.")

@app.post("/api/calcular")
def calculate():
    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return jsonify(error="Envía un objeto con los números."), 400
    try:
        a, b = float(data["a"]), float(data["b"])
        operation = data.get("operacion", "suma")
        if not math.isfinite(a) or not math.isfinite(b):
            raise ValueError()
        if operation == "suma":
            value = a + b
        elif operation == "resta":
            value = a - b
        elif operation == "producto":
            value = a * b
        elif operation == "division":
            if b == 0:
                return jsonify(error="No se puede dividir entre cero."), 400
            value = a / b
        else:
            raise ValueError()
        if not math.isfinite(value):
            raise ValueError()
        return jsonify(resultado=value)
    except (KeyError, ValueError, TypeError, OverflowError):
        return jsonify(error="Ingresa dos números finitos y una operación válida."), 400


# Guía interactiva: operaciones concretas de las celdas del cuaderno.
DEMO_FILES = {"asta": "asta-action.png", "yuno": "yuno.png", "noelle": "noelle.png"}

def load_demo(name):
    from pathlib import Path
    if name not in DEMO_FILES:
        raise ValueError("Personaje no válido.")
    path = Path(app.root_path) / "static" / "images" / DEMO_FILES[name]
    with Image.open(path) as source:
        rgba = source.convert("RGBA")
        rgb = Image.alpha_composite(Image.new("RGBA", rgba.size, (255, 255, 255, 255)), rgba).convert("RGB")
        return cv2.cvtColor(np.array(rgb), cv2.COLOR_RGB2BGR)

@app.get("/cuaderno.ipynb")
def download_notebook():
    from flask import send_from_directory
    return send_from_directory("notebooks", "mi_grimorio.ipynb", as_attachment=True)

@app.post("/api/cuaderno")
def notebook_cell():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify(error="Envía los parámetros de la celda."), 400
    cell = data.get("celda")
    if cell == "fundamentos":
        brillos = [20, 100, 160, 250]
        foto = {"nombre": "Asta", "ancho": 900, "alto": 560}
        lines = [f"{pixel} {'CLARO' if pixel >= 128 else 'OSCURO'}" for pixel in brillos]
        lines.append(f"{foto['nombre']} {foto['ancho']} × {foto['alto']}")
        return jsonify(salida="\n".join(lines))
    if cell == "umbral":
        pixel, threshold = data.get("pixel"), data.get("umbral")
        if type(pixel) is not int or type(threshold) is not int or not 0 <= pixel <= 255 or not 0 <= threshold <= 255:
            return jsonify(error="El píxel y el umbral deben ser enteros de 0 a 255."), 400
        return jsonify(salida="El píxel es " + ("CLARO" if pixel >= threshold else "OSCURO"))
    if cell == "matriz":
        try:
            image = load_demo(data.get("personaje"))
            return jsonify(salida=f"{image.shape}\n{image.dtype}", dimensiones=list(image.shape))
        except (ValueError, TypeError):
            return jsonify(error="Selecciona Asta, Yuno o Noelle."), 400
    return jsonify(error="Celda no válida."), 400

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000)
