from __future__ import annotations

import httpx

from backend.data.bgg_client import BggClient, BggRpgItem

RPG_COLLECTION_XML = """<?xml version="1.0" encoding="utf-8"?>
<items totalitems="2" termsofuse="https://boardgamegeek.com/xmlapi/termsofuse"
       pubdate="Mon, 31 Mar 2026 00:00:00 +0000">
    <item objecttype="thing" objectid="1001" subtype="rpgitem" collid="5001">
        <name sortindex="1">Dungeons &amp; Dragons Player&#39;s Handbook</name>
        <yearpublished>2014</yearpublished>
        <image>https://cf.geekdo-images.com/dnd_phb.png</image>
        <thumbnail>https://cf.geekdo-images.com/dnd_phb_t.png</thumbnail>
        <status own="1" prevowned="0" fortrade="0" want="0" wanttoplay="0"
                wanttobuy="0" wishlist="0" preordered="0"
                lastmodified="2024-01-01 00:00:00" />
    </item>
    <item objecttype="thing" objectid="1002" subtype="rpgitem" collid="5002">
        <name sortindex="1">Pathfinder Core Rulebook</name>
        <yearpublished>2019</yearpublished>
        <image>https://cf.geekdo-images.com/pf_core.png</image>
        <thumbnail>https://cf.geekdo-images.com/pf_core_t.png</thumbnail>
        <status own="1" prevowned="0" fortrade="0" want="0" wanttoplay="0"
                wanttobuy="0" wishlist="0" preordered="0"
                lastmodified="2024-01-01 00:00:00" />
    </item>
</items>"""

RPG_THING_XML = """<?xml version="1.0" encoding="utf-8"?>
<items>
    <item type="rpgitem" id="1001">
        <thumbnail>https://cf.geekdo-images.com/dnd_phb_t.png</thumbnail>
        <image>https://cf.geekdo-images.com/dnd_phb.png</image>
        <yearpublished value="2014"/>
        <description>A guide for adventurers &amp; heroes.</description>
        <link type="rpggenre" value=" Fantasy "/>
        <link type="rpggenre" value="Adventure"/>
        <link type="rpggenre" value="fantasy"/>
        <link type="rpgcategory" value="Core Rules"/>
        <link type="rpgpublisher" value="Ignored Publisher"/>
        <statistics page="1">
            <ratings>
                <average value="8.50"/>
            </ratings>
        </statistics>
    </item>
    <item type="rpgitem" id="1002">
        <thumbnail>https://cf.geekdo-images.com/pf_core_t.png</thumbnail>
        <image>https://cf.geekdo-images.com/pf_core.png</image>
        <yearpublished value="2019"/>
        <description>The complete Pathfinder rules.</description>
        <link type="rpggenre" value="Fantasy"/>
        <link type="rpgcategory" value=" Scenario / Adventure / Module "/>
        <statistics page="1">
            <ratings>
                <average value="9.10"/>
            </ratings>
        </statistics>
    </item>
</items>"""

RPG_THING_XML_MISSING_FIELDS = """<?xml version="1.0" encoding="utf-8"?>
<items>
    <item type="rpgitem" id="1003">
    </item>
</items>"""

RPG_THING_XML_PATHFINDER = """<?xml version="1.0" encoding="utf-8"?>
<items>
    <item type="rpgitem" id="1002">
        <description>The complete Pathfinder rules.</description>
        <link type="rpggenre" value="Fantasy"/>
        <link type="rpgcategory" value="Core Rules"/>
    </item>
</items>"""

RPG_DUPLICATE_COLLECTION_XML = """<?xml version="1.0" encoding="utf-8"?>
<items totalitems="2">
    <item objecttype="thing" objectid="1001" subtype="rpgitem" collid="5001">
        <name>Dungeons &amp; Dragons Player&#39;s Handbook</name>
        <yearpublished>2014</yearpublished>
        <image>https://collection.example/first.png</image>
        <thumbnail>https://collection.example/first_t.png</thumbnail>
    </item>
    <item objecttype="thing" objectid="1001" subtype="rpgitem" collid="5003">
        <name>Dungeons &amp; Dragons Player&#39;s Handbook: Alternate Cover</name>
        <yearpublished>2014</yearpublished>
        <image>https://collection.example/alternate.png</image>
        <thumbnail>https://collection.example/alternate_t.png</thumbnail>
    </item>
</items>"""


class TestBggClientRpgParsing:
    def test_parse_xml_collection_returns_rpg_items(self) -> None:
        client = BggClient("test")
        items = client._parse_xml_collection(RPG_COLLECTION_XML)
        assert len(items) == 2

    def test_parse_xml_collection_rpg_fields(self) -> None:
        client = BggClient("test")
        items = client._parse_xml_collection(RPG_COLLECTION_XML)
        dnd = next(i for i in items if i.bgg_id == 1001)
        assert dnd.name == "Dungeons & Dragons Player's Handbook"
        assert dnd.collection_id == 5001
        assert dnd.thumbnail_url == "https://cf.geekdo-images.com/dnd_phb_t.png"
        assert dnd.image_url == "https://cf.geekdo-images.com/dnd_phb.png"
        assert dnd.year_published == 2014

    def test_parse_xml_collection_all_ids(self) -> None:
        client = BggClient("test")
        items = client._parse_xml_collection(RPG_COLLECTION_XML)
        assert {i.bgg_id for i in items} == {1001, 1002}

    def test_fetch_rpg_details_parses_image_and_description(
        self, monkeypatch: object
    ) -> None:
        class _FakeResponse:
            status_code = 200
            text = RPG_THING_XML

            def raise_for_status(self) -> None:
                pass

        monkeypatch.setattr(httpx, "get", lambda *_a, **_kw: _FakeResponse())
        client = BggClient("test")
        details = client._fetch_rpg_details([1001, 1002])
        assert details[1001].image_url == "https://cf.geekdo-images.com/dnd_phb.png"
        assert details[1001].description == "A guide for adventurers & heroes."
        assert details[1001].bgg_rating == 8.5
        assert details[1001].categories == ("Adventure", "Fantasy")
        assert details[1001].publication_types == ("Core Rules",)
        assert "Ignored Publisher" not in details[1001].categories
        assert "Ignored Publisher" not in details[1001].publication_types
        assert details[1002].bgg_rating == 9.1

    def test_fetch_rpg_details_missing_optional_fields(
        self, monkeypatch: object
    ) -> None:
        class _FakeResponse:
            status_code = 200
            text = RPG_THING_XML_MISSING_FIELDS

            def raise_for_status(self) -> None:
                pass

        monkeypatch.setattr(httpx, "get", lambda *_a, **_kw: _FakeResponse())
        client = BggClient("test")
        details = client._fetch_rpg_details([1003])
        assert details[1003].image_url == ""
        assert details[1003].thumbnail_url == ""
        assert details[1003].year_published == 0
        assert details[1003].bgg_rating == 0.0
        assert details[1003].description == ""
        assert details[1003].categories == ()
        assert details[1003].publication_types == ()

    def test_fetch_rpg_details_skips_failed_batch_and_keeps_successes(
        self, monkeypatch: object
    ) -> None:
        responses = iter(
            [
                (503, ""),
                (200, RPG_THING_XML_PATHFINDER),
            ]
        )

        class _FakeResponse:
            def __init__(self, status_code: int, text: str) -> None:
                self.status_code = status_code
                self.text = text

        monkeypatch.setattr(
            httpx, "get", lambda *_a, **_kw: _FakeResponse(*next(responses))
        )
        monkeypatch.setattr("backend.data.bgg_client.time.sleep", lambda *_a: None)

        details = BggClient("test")._fetch_rpg_details([1001, 1002], batch_size=1)

        assert set(details) == {1002}
        assert details[1002].description == "The complete Pathfinder rules."

    def test_fetch_owned_rpg_items_combines_collection_and_details(
        self, monkeypatch: object
    ) -> None:
        responses = iter([RPG_COLLECTION_XML, RPG_THING_XML])

        class _FakeResponse:
            def __init__(self, text: str) -> None:
                self.status_code = 200
                self.text = text

            def raise_for_status(self) -> None:
                pass

        monkeypatch.setattr(
            httpx, "get", lambda *_a, **_kw: _FakeResponse(next(responses))
        )
        client = BggClient("test")
        items = client.fetch_owned_rpg_items()
        assert len(items) == 2
        dnd = next(i for i in items if i.bgg_id == 1001)
        assert isinstance(dnd, BggRpgItem)
        assert dnd.name == "Dungeons & Dragons Player's Handbook"
        assert dnd.collection_id == 5001
        assert dnd.thumbnail_url == "https://cf.geekdo-images.com/dnd_phb_t.png"
        assert dnd.image_url == "https://cf.geekdo-images.com/dnd_phb.png"
        assert dnd.description == "A guide for adventurers & heroes."
        assert dnd.bgg_rating == 8.5
        assert dnd.year_published == 2014
        assert dnd.categories == ("Adventure", "Fantasy")
        assert dnd.publication_types == ("Core Rules",)
        assert dnd.details_loaded is True

    def test_fetch_owned_rpg_items_keeps_duplicate_collection_entries_distinct(
        self, monkeypatch: object
    ) -> None:
        responses = iter([RPG_DUPLICATE_COLLECTION_XML, RPG_THING_XML])

        class _FakeResponse:
            status_code = 200

            def __init__(self, text: str) -> None:
                self.text = text

        monkeypatch.setattr(
            httpx, "get", lambda *_a, **_kw: _FakeResponse(next(responses))
        )

        items = BggClient("test").fetch_owned_rpg_items()

        assert [item.collection_id for item in items] == [5001, 5003]
        assert [item.image_url for item in items] == [
            "https://collection.example/first.png",
            "https://collection.example/alternate.png",
        ]
        assert [item.thumbnail_url for item in items] == [
            "https://collection.example/first_t.png",
            "https://collection.example/alternate_t.png",
        ]
        assert all(item.bgg_id == 1001 for item in items)
        assert all(item.categories == ("Adventure", "Fantasy") for item in items)
        assert all(item.publication_types == ("Core Rules",) for item in items)
        assert all(item.details_loaded is True for item in items)

    def test_fetch_owned_rpg_items_marks_missing_details(
        self, monkeypatch: object
    ) -> None:
        responses = iter([RPG_COLLECTION_XML, "<items></items>"])

        class _FakeResponse:
            status_code = 200

            def __init__(self, text: str) -> None:
                self.text = text

        monkeypatch.setattr(
            httpx, "get", lambda *_a, **_kw: _FakeResponse(next(responses))
        )

        items = BggClient("test").fetch_owned_rpg_items()

        assert len(items) == 2
        assert all(item.details_loaded is False for item in items)
        assert all(item.categories == () for item in items)
        assert all(item.publication_types == () for item in items)

    def test_fetch_owned_rpg_items_empty_collection(self, monkeypatch: object) -> None:
        class _FakeResponse:
            status_code = 200
            text = '<?xml version="1.0"?><items totalitems="0"></items>'

            def raise_for_status(self) -> None:
                pass

        monkeypatch.setattr(httpx, "get", lambda *_a, **_kw: _FakeResponse())
        client = BggClient("test")
        items = client.fetch_owned_rpg_items()
        assert items == []
