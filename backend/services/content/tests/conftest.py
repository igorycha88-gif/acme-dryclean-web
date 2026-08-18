import os
import tempfile

os.environ.setdefault("UPLOAD_DIR", tempfile.mkdtemp(prefix="content-test-uploads-"))

import pytest


@pytest.fixture
def anyio_backend():
    return "asyncio"
