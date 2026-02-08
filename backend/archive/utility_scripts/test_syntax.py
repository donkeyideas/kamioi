def test_function():
    try:
        if True:
            return "test"
    except Exception as e:
        return str(e)


