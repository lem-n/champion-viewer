class ChampionMinimal {
    constructor(data) {
        this.ownership = new ChampionOwnership(data.ownership);
        this.alias = data.alias;
        this.name = data.name;
        this.active = data.active;
        this.id = data.id;
    }
}

class ChampionOwnership {
    constructor(ownership) {
        this.freeToPlayReward = ownership.freeToPlayReward;
        this.owned = ownership.owned;
        this.rental = ownership.rental;
    }
}

module.exports = {
    ChampionMinimal,
    ChampionOwnership
};
