import re

def dms_to_decimal(coord):
    match = re.match(r"(\d+)º\s*(\d+)'[\s]*(\d+(?:\.\d+)?)''\s*([NSEO])", coord)
    if not match:
        return None

    grados, minutos, segundos, direccion = match.groups()
    decimal = float(grados) + float(minutos)/60 + float(segundos)/3600

    if direccion in ["S", "O"]:
        decimal *= -1

    return round(decimal, 6)