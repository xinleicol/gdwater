


class PollutedCellDao{
    constructor(position, originMass, mass, outMass){

        this._position = position
        this._mass = mass
        this._originMass = originMass
        this._outMass = outMass
    }

    get position(){return this._position}

    set position(p){this._position = p}

    get originMass(){return this._originMass}

    set originMass(om){this._originMass = om}

    get mass(){return this._mass}

    set mass(m){ this._mass = m}

    get outMass(){return this._outMass}

    set outMass(otm){
        this._outMass = otm
    }
}

export default PollutedCellDao