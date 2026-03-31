import os
import sys
from datetime import timedelta

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework.test import APIClient


PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
LOCAL_PACKAGES = os.path.join(PROJECT_ROOT, ".python-packages")
if LOCAL_PACKAGES not in sys.path:
    sys.path.insert(0, LOCAL_PACKAGES)


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def aadhaar_file():
    return SimpleUploadedFile("aadhaar.jpg", b"fake-image-content", content_type="image/jpeg")


@pytest.fixture
def expired_time():
    return timezone.now() - timedelta(minutes=1)
