import io
import json
import unittest
from pathlib import Path
from app import app

class NotebookTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_threshold_boundaries(self):
        for pixel, threshold, state in [(0,128,"OSCURO"),(128,128,"CLARO"),(255,255,"CLARO"),(100,200,"OSCURO")]:
            response = self.client.post("/api/cuaderno",json={"celda":"umbral","pixel":pixel,"umbral":threshold})
            self.assertEqual(response.status_code,200)
            self.assertEqual(response.json["salida"],"El píxel es "+state)
        for invalid in (-1,256,True,"128"):
            self.assertEqual(self.client.post("/api/cuaderno",json={"celda":"umbral","pixel":invalid,"umbral":128}).status_code,400)

    def test_fundamentals_and_matrix(self):
        text=self.client.post("/api/cuaderno",json={"celda":"fundamentos"}).json["salida"]
        self.assertIn("20 OSCURO",text)
        self.assertIn("250 CLARO",text)
        for name in ("asta","yuno","noelle"):
            response=self.client.post("/api/cuaderno",json={"celda":"matriz","personaje":name})
            self.assertEqual(response.status_code,200)
            self.assertEqual(response.json["dimensiones"][2],3)
        self.assertEqual(self.client.post("/api/cuaderno",json={"celda":"matriz","personaje":"../app.py"}).status_code,400)
        self.assertEqual(self.client.post("/api/cuaderno",json={"celda":"desconocida"}).status_code,400)

    def test_demo_filters_and_download(self):
        for name in ("asta","yuno","noelle"):
            for filt in ("grises","gaussiano","bordes","umbral"):
                response=self.client.post("/api/imagen",data={"demo":name,"filtro":filt})
                self.assertEqual(response.status_code,200)
                self.assertTrue(response.json["resultado"].startswith("data:image/png;base64,"))
                self.assertEqual(sum(response.json["histograma"]),response.json["ancho"]*response.json["alto"])
        response=self.client.get("/cuaderno.ipynb")
        self.assertEqual(response.status_code,200)
        self.assertIn("attachment",response.headers["Content-Disposition"])
        notebook=json.loads(response.data)
        self.assertEqual(notebook["nbformat"],4)
        for cell in notebook["cells"]:
            if cell["cell_type"]=="code":
                source="".join(cell["source"])
                if not source.startswith("%"):
                    compile(source,"notebook","exec")
        response.close()
