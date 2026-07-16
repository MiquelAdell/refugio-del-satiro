from __future__ import annotations

import httpx

from backend.data.bgg_client import BggClient

SAMPLE_XML = """<?xml version="1.0" encoding="utf-8"?>
<items totalitems="3" termsofuse="https://boardgamegeek.com/xmlapi/termsofuse" pubdate="Mon, 31 Mar 2026 00:00:00 +0000">
    <item objecttype="thing" objectid="13" subtype="boardgame" collid="1001">
        <name sortindex="1">Catan</name>
        <yearpublished>1995</yearpublished>
        <image>https://cf.geekdo-images.com/catan.png</image>
        <thumbnail>https://cf.geekdo-images.com/catan_t.png</thumbnail>
        <status own="1" prevowned="0" fortrade="0" want="0" wanttoplay="0" wanttobuy="0" wishlist="0" preordered="0" lastmodified="2024-01-01 00:00:00" />
    </item>
    <item objecttype="thing" objectid="174430" subtype="boardgame" collid="1002">
        <name sortindex="1">Gloomhaven</name>
        <yearpublished>2017</yearpublished>
        <image>https://cf.geekdo-images.com/gloom.png</image>
        <thumbnail>https://cf.geekdo-images.com/gloom_t.png</thumbnail>
        <status own="1" prevowned="0" fortrade="0" want="0" wanttoplay="0" wanttobuy="0" wishlist="0" preordered="0" lastmodified="2024-01-01 00:00:00" />
    </item>
    <item objecttype="thing" objectid="230802" subtype="boardgame" collid="1003">
        <name sortindex="1">Azul</name>
        <yearpublished>2017</yearpublished>
        <image>https://cf.geekdo-images.com/azul.png</image>
        <thumbnail>https://cf.geekdo-images.com/azul_t.png</thumbnail>
        <status own="1" prevowned="0" fortrade="0" want="0" wanttoplay="0" wanttobuy="0" wishlist="0" preordered="0" lastmodified="2024-01-01 00:00:00" />
    </item>
</items>"""

THING_XML = """<?xml version="1.0" encoding="utf-8"?>
<items>
    <item type="boardgame" id="13">
        <thumbnail>https://cf.geekdo-images.com/catan_t.png</thumbnail>
        <image>https://cf.geekdo-images.com/catan.png</image>
        <description>Trade &amp;amp; build across the island.</description>
        <minplayers value="3"/>
        <maxplayers value="4"/>
        <playingtime value="90"/>
        <link type="boardgamecategory" value=" Strategy "/>
        <link type="boardgamecategory" value="Economic"/>
        <link type="boardgamecategory" value="strategy"/>
        <link type="boardgamepublisher" value="Ignored Publisher"/>
        <statistics><ratings><average value="7.15"/></ratings></statistics>
    </item>
</items>"""


class TestBggClientParsing:
    def test_parses_collection_xml(self) -> None:
        client = BggClient("test")
        games = client._parse_xml_collection(SAMPLE_XML)
        assert len(games) == 3

    def test_parses_game_fields(self) -> None:
        client = BggClient("test")
        games = client._parse_xml_collection(SAMPLE_XML)
        catan = next(g for g in games if g.bgg_id == 13)
        assert catan.name == "Catan"
        assert catan.thumbnail_url == "https://cf.geekdo-images.com/catan_t.png"
        assert catan.year_published == 1995

    def test_parses_all_game_ids(self) -> None:
        client = BggClient("test")
        games = client._parse_xml_collection(SAMPLE_XML)
        ids = {g.bgg_id for g in games}
        assert ids == {13, 174430, 230802}

    def test_handles_empty_collection(self) -> None:
        client = BggClient("test")
        games = client._parse_xml_collection(
            '<?xml version="1.0"?><items totalitems="0"></items>'
        )
        assert games == []

    def test_handles_missing_thumbnail(self) -> None:
        xml = """<?xml version="1.0"?>
        <items totalitems="1">
            <item objecttype="thing" objectid="1" subtype="boardgame" collid="1">
                <name>Test Game</name>
                <yearpublished>2020</yearpublished>
            </item>
        </items>"""
        client = BggClient("test")
        games = client._parse_xml_collection(xml)
        assert len(games) == 1
        assert games[0].thumbnail_url == ""

    def test_fetch_details_parses_description_and_normalized_categories(
        self, monkeypatch: object
    ) -> None:
        class _FakeResponse:
            status_code = 200
            text = THING_XML

        monkeypatch.setattr(httpx, "get", lambda *_a, **_kw: _FakeResponse())

        details = BggClient("test").fetch_details([13])

        assert details[13].description == "Trade & build across the island."
        assert details[13].categories == ("Economic", "Strategy")
        assert details[13].image_url == "https://cf.geekdo-images.com/catan.png"
        assert details[13].min_players == 3
        assert details[13].max_players == 4
        assert details[13].playing_time == 90
        assert details[13].bgg_rating == 7.15
