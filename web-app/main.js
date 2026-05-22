import R from "./ramda.js";
import Unoludo from "./unoludo.js";
import UnoludoBoard from "./board_positions.js";
import UnoludoAssets from "./assets.js";

/*global document*/

let state = Unoludo.create_initial_state([
    "You",
    "CPU Green",
    "CPU Red",
    "CPU Yellow"
], {
    shuffle: true
});

let selected_card_id = undefined;

const piece_layer = document.getElementById("piece-layer");
const hand_cards = document.getElementById("hand-cards");
const current_player_text = document.getElementById("current-player");
const top_discard_text = document.getElementById("top-discard");
const draw_count_text = document.getElementById("draw-count");
const game_log = document.getElementById("game-log");
const action_message = document.getElementById("action-message");

const play_selected_card_on_plane = function (plane_index) {
    const player = Unoludo.current_player(state);
    const card = Unoludo.card_in_hand(player, selected_card_id);
    let next_state;

    if (card === undefined) {
        action_message.textContent = "Select a card first.";
        return;
    }

    if (!Unoludo.can_play_card(card, state)) {
        action_message.textContent = "That card cannot be played on the current discard.";
        return;
    }

    if (card.type === "number" && card.value > 0) {
        next_state = Unoludo.play_number_card(
            state,
            selected_card_id,
            plane_index
        );
    }

    if (card.type === "number" && card.value === 0) {
        next_state = Unoludo.play_zero_card(
            state,
            selected_card_id,
            plane_index
        );
    }

    if (next_state === undefined) {
        action_message.textContent = "That move is not legal for this plane.";
        return;
    }

    state = next_state;
    selected_card_id = undefined;
    action_message.textContent = "Move played.";
    render();
};

const render_piece = function (player, plane, plane_index) {
    const position = UnoludoBoard.position_for_plane(
        plane,
        player.colour,
        plane_index
    );

    let piece;
    let image;

    if (position === undefined) {
        return;
    }

    piece = document.createElement("div");
    piece.className = "piece";

    if (plane.shielded) {
        piece.className += " shielded";
    }

    if (plane.frozen) {
        piece.className += " frozen";
    }

    piece.style.left = position.x + "%";
    piece.style.top = position.y + "%";

    image = document.createElement("img");
    image.src = UnoludoAssets.plane_image(player.colour);
    image.alt = player.colour + " plane";

    piece.appendChild(image);

    if (player.kind === "human") {
        piece.addEventListener("click", function () {
            play_selected_card_on_plane(plane_index);
        });
    }

    piece_layer.appendChild(piece);
};

const render_pieces = function () {
    piece_layer.replaceChildren();

    state.players.forEach(function (player) {
        player.planes.forEach(function (plane, plane_index) {
            render_piece(player, plane, plane_index);
        });
    });
};

const render_hand = function () {
    const player = Unoludo.current_player(state);

    hand_cards.replaceChildren();

    player.hand.forEach(function (card) {
        const image = document.createElement("img");

        image.className = "card-image";

        if (Unoludo.can_play_card(card, state)) {
            image.className += " playable-card";
        }

        if (card.id === selected_card_id) {
            image.className += " selected-card";
        }
        image.src = UnoludoAssets.card_image(card);
        image.alt = card.id;
        image.addEventListener("click", function () {
            selected_card_id = card.id;
            render();
        });
        if (card.id === selected_card_id) {
            image.className = "card-image selected-card";
        } else {
            image.className = "card-image";
        }
        hand_cards.appendChild(image);
    });
};

const render_info = function () {
    const top_card = Unoludo.top_discard(state);
    const current_player = Unoludo.current_player(state);

    current_player_text.textContent = "Current Player: " + current_player.name;
    top_discard_text.textContent = "Top Discard: " + top_card.id;
    draw_count_text.textContent = "Draw Pile: " + state.draw_pile.length;

    game_log.replaceChildren();

    state.log.forEach(function (message) {
        const item = document.createElement("li");
        item.textContent = message;
        game_log.appendChild(item);
    });
};

const render = function () {
    render_pieces();
    render_hand();
    render_info();
};

const set_demo_plane = function (status, position) {
    const player = state.players[0];

    const blue_plane = Object.freeze({
        status: status,
        position: position,
        shielded: false,
        frozen: false
    });

    state = Unoludo.update_plane(
        state,
        player.id,
        0,
        blue_plane
    );

    render();
};

document.getElementById("reset-demo").addEventListener("click", function () {
    state = Unoludo.create_initial_state([
        "You",
        "CPU Green",
        "CPU Red",
        "CPU Yellow"
    ], {
        shuffle: true
    });
    render();
});

document.getElementById("show-track-demo").addEventListener("click", function () {
    set_demo_plane("track", 0);
});

document.getElementById("show-home-demo").addEventListener("click", function () {
    set_demo_plane("home", 0);
});

render();