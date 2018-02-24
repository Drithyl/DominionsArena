
var characterModule;
var keys;
var db;

module.exports =
{
  online: {},
  list: {}, //populated by revivePlayers() (and revive() when a new player is created)

  init: function(database, playersFetched, characterMod, index)
  {
    keys = index;
    db = database;
    characterModule = characterMod;

    try
    {
      revivePlayers(playersFetched);
    }

    catch(err)
    {
      throw err;
    }

    return this;
  },

  create: function()
  {
    return {"username": username, characterKeys: []};
  },

  areCharactersCreated: function(username)
  {
    if (this.list[username] == null)
    {
      return false;
    }

    else return true;
  },

  addOnline: function(username)
  {
    this.online[username] = this.list[username];
  },

  getClientPack: function()
  {
    var obj = {};

    for (var key in this.online)
    {
      obj[key] = this.online[key];
    }

    return obj;
  },

  /*
  * Reattach the relevant data to one player object on server launch and add it
  * to the list of players of this module.  Arguments:
  *
  *    player         A player object (usually generated by create()) to be
  *                   revived.
  *
  * This function may fail for several reasons:
  *
  *    Error          When calling characterModule.reviveCharacters(), an error
  *                   is thrown there, in which case this player will not be
  *                   added to the list.
  */

  revive: function(player)
  {
    try
    {
      player.characters = characterModule.reviveCharacters(player.username);
    }

    catch(err)
    {
      throw err;
    }

    this.list[player.username] = player;
  },

  /*
  * Save the player's state in the database. This will also save the characters
  * state. Arguments:
  *
  *   player         The player object to be saved. Its format is explicitly
  *                  declared in the create() function of this module, on top
  *                  the .characters property that is added to it once revived,
  *                  that contains the current state of each of the characters
  *                  controlled by this player.
  *
  *   cb             The callback function called once the saving is done, or
  *                  when an error occurs.
  *
  * This function may fail for several reasons:
  *
  *   ThrownError    The saveCharacters() function called in the character module
  *                  throws an error, likely because it could not save a character
  *                  into the database.
  *
  *   DBError        The attempt to save the player in the database
  *                  threw an error, which is then passed into the callback.
  */

  save: function(player, cb)
  {
    var clone = player.functionless();

    characterModule.saveCharacters(clone.characters, function(err, res)
    {
      if (err)
      {
        cb(err.name + ": in save(): " + err.message, null);
        return;
      }

      db.save("players", clone, function(err, res)
      {
        if (err)
        {
          cb(err.name + ": in save(): " + err.message, null);
          return;
        }

        cb(null, res);
      });
    });
  }
}

/*
* Reattach the relevant data to the player objects on server launch.  Arguments:
*
*    players        An array of players to be revived.
*
* This function may fail for several reasons:
*
*    Error          When calling module.exports.revive(), an error is thrown
*                   there. When this is called during server launch, it will
*                   result in a critical error, as the launch process will be
*                   incorrect.
*/

function revivePlayers(players)
{
  if (players == null)
  {
    return;
  }

  for (var i = 0; i < players.length; i++)
  {
    try
    {
      players[i] = module.exports.revive(players[i]);
    }

    catch(err)
    {
      throw err;
    }
  }
}
