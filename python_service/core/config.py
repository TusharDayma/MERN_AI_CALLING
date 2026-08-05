import os
import sys

# Ensure parent directory is in sys.path to import root config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import *  # noqa: F401, F403

