from app.schemas.transports import TransportType

TARIFFS_PER_MINUTE = {
    TransportType.BICICLETA: 50.0,   # COP por minuto (ejemplo)
    TransportType.PATINETA: 100.0,
}

def calculate_cost(transport_type: TransportType, duration_minutes: int) -> float:
    rate = TARIFFS_PER_MINUTE.get(transport_type, 80.0)
    return round(rate * max(duration_minutes, 1), 2)
