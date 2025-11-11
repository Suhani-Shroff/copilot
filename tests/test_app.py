import pytest
from fastapi.testclient import TestClient
from src.app import app

# Create a test client
client = TestClient(app)

def test_root_redirect():
    """Test that root endpoint serves static/index.html"""
    response = client.get("/")
    assert response.status_code == 200  # Direct response with redirection handled internally

def test_get_activities():
    """Test getting all activities"""
    response = client.get("/activities")
    assert response.status_code == 200
    activities = response.json()
    
    # Check that we get a dictionary of activities
    assert isinstance(activities, dict)
    # Check that each activity has required fields
    for activity_name, details in activities.items():
        assert isinstance(activity_name, str)
        assert isinstance(details, dict)
        assert "description" in details
        assert "schedule" in details
        assert "max_participants" in details
        assert "participants" in details
        assert isinstance(details["participants"], list)

def test_signup_for_activity():
    """Test signing up for an activity"""
    # Get the first activity name from the list
    activities = client.get("/activities").json()
    activity_name = next(iter(activities.keys()))
    
    # Try to sign up a new participant
    email = "newstudent@mergington.edu"
    response = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert response.status_code == 200
    result = response.json()
    assert "message" in result
    assert email in result["message"]
    assert activity_name in result["message"]
    
    # Verify participant was added
    activities = client.get("/activities").json()
    assert email in activities[activity_name]["participants"]

def test_signup_duplicate():
    """Test that signing up twice fails"""
    # Get the first activity name from the list
    activities = client.get("/activities").json()
    activity_name = next(iter(activities.keys()))
    
    # Sign up a participant
    email = "duptest@mergington.edu"
    client.post(f"/activities/{activity_name}/signup?email={email}")
    
    # Try to sign up the same participant again
    response = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert response.status_code == 400
    assert "already signed up" in response.json()["detail"].lower()

def test_signup_nonexistent_activity():
    """Test signing up for a non-existent activity"""
    response = client.post("/activities/nonexistent/signup?email=test@mergington.edu")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_unregister_participant():
    """Test unregistering a participant from an activity"""
    # First, get an activity and sign up a test participant
    activities = client.get("/activities").json()
    activity_name = next(iter(activities.keys()))
    email = "unregistertest@mergington.edu"
    
    # Sign up the participant
    client.post(f"/activities/{activity_name}/signup?email={email}")
    
    # Now unregister them
    response = client.delete(f"/activities/{activity_name}/participants/{email}")
    assert response.status_code == 200
    assert response.json()["message"] == f"Unregistered {email} from {activity_name}"
    
    # Verify participant was removed
    activities = client.get("/activities").json()
    assert email not in activities[activity_name]["participants"]

def test_unregister_nonexistent_participant():
    """Test unregistering a non-existent participant"""
    activities = client.get("/activities").json()
    activity_name = next(iter(activities.keys()))
    email = "nonexistent@mergington.edu"
    
    response = client.delete(f"/activities/{activity_name}/participants/{email}")
    assert response.status_code == 400
    assert "not registered" in response.json()["detail"].lower()

def test_unregister_from_nonexistent_activity():
    """Test unregistering from a non-existent activity"""
    response = client.delete("/activities/nonexistent/participants/test@mergington.edu")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()