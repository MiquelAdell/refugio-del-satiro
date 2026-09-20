from scraper.asset_fetcher import should_rehost


def test_should_rehost_google_sites_session_image() -> None:
    image_url = (
        "https://sites.google.com/sitesv-images-rt/"
        "AMxu72u5T6YlyI1FLbjF0O7HQOXCanRUzt44pqY3NyFxozSGzLlLeGo4YdS8"
    )

    assert should_rehost(image_url) is True


def test_should_rehost_account_scoped_google_sites_session_image() -> None:
    image_url = (
        "https://sites.google.com/u/0/sitesv-images-rt/"
        "AMxu72u5T6YlyI1FLbjF0O7HQOXCanRUzt44pqY3NyFxozSGzLlLeGo4YdS8"
    )

    assert should_rehost(image_url) is True


def test_should_not_rehost_unrelated_image() -> None:
    assert should_rehost("https://example.com/image.png") is False
