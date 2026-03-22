# tests/test_app.py

def test_app_import():
    import app
    assert True

# tests/test_model.py

def test_model_output():
    from model import predict

    result = predict("hello")
    assert result is not None