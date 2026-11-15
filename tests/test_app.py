import io
import unittest
import cv2
import numpy as np
from app import app, apply_filter

class AppTests(unittest.TestCase):
    def setUp(self):
        self.client=app.test_client()
    def test_health_and_home(self):
        self.assertEqual(self.client.get("/health").json, {"status":"ok"})
        self.assertIn(b"AulaVis", self.client.get("/").data)
    def test_filters(self):
        image=np.zeros((24,24,3),dtype=np.uint8)
        image[:,12:]=255
        for name in ("grises","gaussiano","bordes","umbral"):
            result=apply_filter(image,name)
            self.assertEqual(result.shape[:2],(24,24))
        self.assertEqual(set(np.unique(apply_filter(image,"umbral"))),{0,255})
        self.assertGreater(np.count_nonzero(apply_filter(image,"bordes")),0)
    def test_image_upload(self):
        image=np.zeros((12,16,3),dtype=np.uint8)
        ok,encoded=cv2.imencode(".png",image)
        response=self.client.post("/api/imagen",data={"imagen":(io.BytesIO(encoded.tobytes()),"demo.png"),"filtro":"grises"})
        self.assertEqual(response.status_code,200)
        self.assertEqual(response.json["ancho"],16)
        self.assertTrue(response.json["resultado"].startswith("data:image/png;base64,"))
        self.assertEqual(sum(response.json["histograma"]),192)
    def test_invalid_upload(self):
        self.assertEqual(self.client.post("/api/imagen").status_code,400)
        self.assertEqual(self.client.post("/api/imagen",data={"imagen":(io.BytesIO(b"bad"),"x.png")}).status_code,400)
    def test_calculator(self):
        for op,value in (("suma",5),("resta",1),("producto",6),("division",1.5)):
            self.assertEqual(self.client.post("/api/calcular",json={"a":3,"b":2,"operacion":op}).json["resultado"],value)
        for data in ({"a":1,"b":0,"operacion":"division"},{"a":"nan","b":2},{"a":1,"b":2,"operacion":"invalid"},[]):
            self.assertEqual(self.client.post("/api/calcular",json=data).status_code,400)
    def test_greeting(self):
        self.assertIn("Lorena",self.client.post("/api/saludo",json={"nombre":"Lorena","edad":20}).json["mensaje"])
        self.assertEqual(self.client.post("/api/saludo",json={"nombre":"","edad":20}).status_code,400)
        self.assertEqual(self.client.post("/api/saludo",json={"nombre":"X","edad":-1}).status_code,400)

if __name__=="__main__":
    unittest.main()
