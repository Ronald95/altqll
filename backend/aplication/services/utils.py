def as_list(value):
    if not value:
        return []
    if isinstance(value, list):
        return value
    return [value]
