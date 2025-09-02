from app.repositories import transports_repo, loans_repo, payments_repo
from app.schemas.transports import TransportType
from app.services.pricing_service import calculate_cost

def open_loan(user_id:int, transport_id:int, origin_station_id:int,
              destination_station_id:int, duration_minutes:int) -> dict:
    t = transports_repo.get_transport(transport_id)
    if not t or t["status"] != "DISPONIBLE":
        raise ValueError("Transporte no disponible")

    cost = calculate_cost(TransportType(t["type"]), duration_minutes)
    loan = loans_repo.create_loan({
        "user_id": user_id,
        "transport_id": transport_id,
        "origin_station_id": origin_station_id,
        "destination_station_id": destination_station_id,
        "duration_minutes": duration_minutes,
        "cost": cost,
        "status": "ABIERTO",
    })
    transports_repo.update_transport(transport_id, status="EN_USO")
    return loan

def close_loan(loan_id:int, method:str="EFECTIVO") -> dict:
    loan = loans_repo.get_loan(loan_id)
    if not loan or loan["status"] != "ABIERTO":
        raise ValueError("Préstamo inválido")

    payment = payments_repo.create_payment(loan_id=loan_id, amount=loan["cost"], method=method)
    loan["status"] = "CERRADO"
    # devolver transporte a destino y marcar disponible
    transports_repo.update_transport(loan["transport_id"], status="DISPONIBLE",
                                     station_id=loan["destination_station_id"])
    return {"loan": loan, "payment": payment}
