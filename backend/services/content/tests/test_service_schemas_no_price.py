from datetime import datetime
from uuid import uuid4

import pytest

from app.schemas.schemas import (
    ServiceCreate,
    ServiceResponse,
    ServiceUpdate,
)


class TestServiceSchemasNoPrice:
    def test_service_create_ignores_price_field(self):
        data = {
            "title": "Химчистка диванов",
            "slug": "himchistka-divanov",
            "description": "Чистка диванов",
            "price": 1700,
        }
        schema = ServiceCreate.model_validate(data)
        assert not hasattr(schema, "price")
        assert schema.title == "Химчистка диванов"

    def test_service_update_ignores_price_field(self):
        schema = ServiceUpdate.model_validate({"price": 999})
        assert not hasattr(schema, "price")
        assert schema.model_dump(exclude_unset=True) == {}

    def test_service_response_has_no_price(self):
        schema = ServiceResponse(
            id=uuid4(),
            title="Химчистка ковров",
            slug="himchistka-kovrov",
            description="Чистка ковров",
            created_at=datetime(2026, 1, 1),
            updated_at=datetime(2026, 1, 1),
        )
        dumped = schema.model_dump()
        assert "price" not in dumped
        assert "priceCurrency" not in dumped

    def test_service_response_model_fields(self):
        expected = {
            "id",
            "title",
            "slug",
            "description",
            "image_url",
            "category",
            "is_active",
            "sort_order",
            "created_at",
            "updated_at",
        }
        schema = ServiceResponse(
            id=uuid4(),
            title="t",
            slug="t",
            description="d",
            created_at=datetime(2026, 1, 1),
            updated_at=datetime(2026, 1, 1),
        )
        assert set(schema.model_dump().keys()) == expected

    @pytest.mark.parametrize("payload_price", [0, 100, 999999.99, None])
    def test_create_with_any_price_value_is_dropped(self, payload_price):
        schema = ServiceCreate.model_validate(
            {
                "title": "Услуга",
                "slug": "usluga",
                "description": "Описание",
                "price": payload_price,
            }
        )
        assert "price" not in schema.model_dump()
