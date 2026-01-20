from django.core.management.base import BaseCommand
from aplication.services.tripulante_sync import sync_tripulante_por_rut
import time

class Command(BaseCommand):
    help = "Sincroniza tripulantes desde API externa"

    def add_arguments(self, parser):
        parser.add_argument(
            "--token",
            type=str,
            required=True,
            help="Token de autenticación"
        )

    def handle(self, *args, **options):
        token = options["token"]

        ruts = [
          "13593143",
          "10326910",
          "9075447",
          "9182917",
          "17947132",
          "6689117",
          "10468988",
          "9406019",
          "19166054"
        ]

        for rut in ruts:
            try:
                self.stdout.write(f"🔄 Procesando RUT {rut}")
                sync_tripulante_por_rut(rut, token)
                time.sleep(5)  # ⛔ no saturar la API
                print("Después de 5 segundos")
            except Exception as e:
                self.stderr.write(f"❌ Error con {rut}: {e}")
